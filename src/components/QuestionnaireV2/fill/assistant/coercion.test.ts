import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Question } from "@/types/questionnaire/question";

import {
  checkSetValueBounds,
  coerceBoolean,
  coerceChoiceOption,
  coerceDateTime,
  coerceDecimal,
  coerceInteger,
  coerceLocalDate,
  coercePlainResponseValue,
  coerceTime,
  MAX_NOTE_LENGTH,
  MAX_RESPONSE_ENTRIES,
  MAX_RESPONSE_TEXT_LENGTH,
} from "./coercion";

function question(
  overrides: Partial<Question> & Pick<Question, "type">,
): Pick<Question, "type" | "link_id" | "answer_option" | "answer_value_set"> {
  return { link_id: "q1", ...overrides };
}

describe("coerceInteger — P1-19: whole numbers only", () => {
  it("accepts a plain integer string", () => {
    const result = coerceInteger("5");
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value, 5);
  });

  it("accepts a negative integer", () => {
    const result = coerceInteger("-3");
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value, -3);
  });

  it("accepts a numeric literal", () => {
    const result = coerceInteger(7);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value, 7);
  });

  it("accepts an integral value spelled with a decimal point", () => {
    // "5.0" is textually non-integral but numerically whole — the check
    // is on the PARSED value's integrality, not the input's digits.
    const result = coerceInteger("5.0");
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value, 5);
  });

  it("rejects a non-integral string — the P1-19 bug", () => {
    const result = coerceInteger("5.5");
    assert.equal(result.ok, false);
  });

  it("rejects a non-integral number", () => {
    const result = coerceInteger(5.5);
    assert.equal(result.ok, false);
  });

  it("rejects non-numeric text", () => {
    const result = coerceInteger("abc");
    assert.equal(result.ok, false);
  });

  it("rejects a boolean (Number(true) === 1 must not sneak through)", () => {
    const result = coerceInteger(true);
    assert.equal(result.ok, false);
  });

  it('rejects an empty string (Number("") === 0 must not sneak through)', () => {
    const result = coerceInteger("");
    assert.equal(result.ok, false);
  });

  it("rejects a whitespace-only string", () => {
    const result = coerceInteger("   ");
    assert.equal(result.ok, false);
  });

  it("rejects Infinity / NaN spellings", () => {
    assert.equal(coerceInteger("Infinity").ok, false);
    assert.equal(coerceInteger("NaN").ok, false);
  });
});

describe("coerceDecimal — any finite number", () => {
  it("accepts a non-integral value", () => {
    const result = coerceDecimal("5.5");
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value, 5.5);
  });

  it("accepts a whole number too", () => {
    const result = coerceDecimal("5");
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value, 5);
  });

  it("rejects non-numeric text", () => {
    assert.equal(coerceDecimal("abc").ok, false);
  });

  it("rejects a boolean", () => {
    assert.equal(coerceDecimal(false).ok, false);
  });

  it("rejects an empty string", () => {
    assert.equal(coerceDecimal("").ok, false);
  });
});

describe("coerceBoolean", () => {
  for (const [input, expected] of [
    ["yes", true],
    ["Yes", true],
    ["y", true],
    ["true", true],
    ["1", true],
    ["no", false],
    ["No", false],
    ["n", false],
    ["false", false],
    ["0", false],
  ] as const) {
    it(`"${input}" -> ${expected}`, () => {
      const result = coerceBoolean(input);
      assert.equal(result.ok, true);
      assert.equal(result.ok && result.value, expected);
    });
  }

  it("passes a real boolean through", () => {
    assert.equal(coerceBoolean(true).ok, true);
  });

  it("treats a nonzero number as true, zero as false", () => {
    const truthy = coerceBoolean(2);
    assert.equal(truthy.ok, true);
    assert.equal(truthy.ok && truthy.value, true);
    const falsy = coerceBoolean(0);
    assert.equal(falsy.ok, true);
    assert.equal(falsy.ok && falsy.value, false);
  });

  it('rejects an unrecognized word — Boolean("false") must not sneak through as true', () => {
    const result = coerceBoolean("banana");
    assert.equal(result.ok, false);
  });
});

describe("coerceLocalDate — P1-19: strict local YYYY-MM-DD with round-trip validation", () => {
  it("parses an ordinary date as a LOCAL midnight, not UTC", () => {
    const result = coerceLocalDate("2024-06-15");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.getFullYear(), 2024);
    assert.equal(result.value.getMonth(), 5); // 0-indexed: June
    assert.equal(result.value.getDate(), 15);
    assert.equal(result.value.getHours(), 0);
  });

  it("rejects a calendar rollover (2024-02-31) instead of silently normalizing it", () => {
    const result = coerceLocalDate("2024-02-31");
    assert.equal(result.ok, false);
  });

  it("rejects 2023-02-29 (2023 is not a leap year)", () => {
    assert.equal(coerceLocalDate("2023-02-29").ok, false);
  });

  it("accepts 2024-02-29 (2024 IS a leap year)", () => {
    const result = coerceLocalDate("2024-02-29");
    assert.equal(result.ok, true);
  });

  it("rejects a non-zero-padded date (wrong format, not just wrong value)", () => {
    assert.equal(coerceLocalDate("2024-6-15").ok, false);
  });

  it("rejects a US-style date", () => {
    assert.equal(coerceLocalDate("06/15/2024").ok, false);
  });

  it("rejects a datetime string (date-only field must not accept a time component)", () => {
    assert.equal(coerceLocalDate("2024-06-15T00:00:00Z").ok, false);
  });

  it("handles a 4-digit year under 100 without the Date constructor's 2-digit-year rewrite", () => {
    // new Date(99, 0, 1).getFullYear() === 1999 (legacy quirk) — this must
    // NOT be why "0099-01-01" gets rejected; it is rejected only if the
    // round trip genuinely fails, and it must not silently become 1999.
    const result = coerceLocalDate("0099-01-01");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.getFullYear(), 99);
  });

  it("rejects garbage text", () => {
    assert.equal(coerceLocalDate("not-a-date").ok, false);
  });
});

describe("coerceDateTime", () => {
  it("accepts a UTC ISO datetime", () => {
    const result = coerceDateTime("2024-06-15T14:30:00Z");
    assert.equal(result.ok, true);
    if (result.ok)
      assert.equal(result.value.toISOString(), "2024-06-15T14:30:00.000Z");
  });

  it("accepts an offset ISO datetime", () => {
    const result = coerceDateTime("2024-06-15T14:30:00+05:30");
    assert.equal(result.ok, true);
  });

  it("rejects a calendar rollover in the date portion", () => {
    assert.equal(coerceDateTime("2024-02-31T10:00:00Z").ok, false);
  });

  it("rejects garbage text", () => {
    assert.equal(coerceDateTime("not-a-datetime").ok, false);
  });

  it("rejects a bare date (no time component)", () => {
    assert.equal(coerceDateTime("2024-06-15").ok, false);
  });
});

describe("coerceTime", () => {
  it("accepts bare HH:mm", () => {
    assert.equal(coerceTime("14:30").ok, true);
  });

  it("accepts HH:mm:ss", () => {
    assert.equal(coerceTime("14:30:00").ok, true);
  });

  it("rejects an out-of-range hour", () => {
    assert.equal(coerceTime("25:00").ok, false);
  });

  it("rejects garbage", () => {
    assert.equal(coerceTime("abc").ok, false);
  });
});

describe("coerceChoiceOption", () => {
  const options = [
    { value: "mild", display: "Mild" },
    { value: "severe", display: "Severe", code: { code: "sev-1" } },
  ];

  it("matches by exact value", () => {
    const result = coerceChoiceOption("mild", options);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value.value, "mild");
  });

  it("matches by display text, case-insensitively", () => {
    const result = coerceChoiceOption("SEVERE", options);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value.value, "severe");
    assert.deepEqual(result.ok && result.value.coding, { code: "sev-1" });
  });

  it("rejects an option not on the list", () => {
    assert.equal(coerceChoiceOption("moderate", options).ok, false);
  });
});

describe("coercePlainResponseValue — the full dispatch", () => {
  it("rejects a non-integral value for an integer question (P1-19, end to end)", () => {
    const result = coercePlainResponseValue(
      question({ type: "integer" }),
      "5.5",
    );
    assert.equal(result.ok, false);
  });

  it("accepts an integral value for an integer question", () => {
    const result = coercePlainResponseValue(question({ type: "integer" }), "5");
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok && result.value, { type: "number", value: 5 });
  });

  it("rejects a rollover date for a date question (P1-19, end to end)", () => {
    const result = coercePlainResponseValue(
      question({ type: "date" }),
      "2024-02-31",
    );
    assert.equal(result.ok, false);
  });

  it("produces a LOCAL date for a date question", () => {
    const result = coercePlainResponseValue(
      question({ type: "date" }),
      "2024-06-15",
    );
    assert.equal(result.ok, true);
    if (result.ok && result.value.type === "date" && result.value.value) {
      assert.equal(result.value.value.getFullYear(), 2024);
      assert.equal(result.value.value.getDate(), 15);
    } else {
      assert.fail("expected a date value");
    }
  });

  it("rejects free text on a value-set-backed choice with no fixed options", () => {
    const result = coercePlainResponseValue(
      question({ type: "choice", answer_value_set: { system: "x" } as never }),
      "anything",
    );
    assert.equal(result.ok, false);
  });

  it("accepts a plain string for a choice with no options and no value set", () => {
    const result = coercePlainResponseValue(
      question({ type: "choice" }),
      "free text",
    );
    assert.equal(result.ok, true);
  });

  it("matches a fixed-option choice and carries its coding", () => {
    const result = coercePlainResponseValue(
      question({
        type: "choice",
        answer_option: [
          { value: "mild" },
          { value: "severe", code: { code: "s1" } as never },
        ],
      }),
      "severe",
    );
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok && result.value, {
      type: "string",
      value: "severe",
      coding: { code: "s1" },
    });
  });

  it("rejects a structured question type (no unambiguous scalar form)", () => {
    const result = coercePlainResponseValue(
      question({ type: "structured" }),
      "x",
    );
    assert.equal(result.ok, false);
  });

  it("rejects a quantity question (value+unit+coding out of scope, matching the old registry)", () => {
    const result = coercePlainResponseValue(
      question({ type: "quantity" }),
      "5",
    );
    assert.equal(result.ok, false);
  });
});

describe("checkSetValueBounds", () => {
  it("accepts a well-formed request", () => {
    assert.equal(checkSetValueBounds(["a"], "a note").ok, true);
  });

  it("rejects too many entries", () => {
    const values = Array.from({ length: MAX_RESPONSE_ENTRIES + 1 }, () => "x");
    assert.equal(checkSetValueBounds(values, undefined).ok, false);
  });

  it("rejects an over-long text value", () => {
    const value = "x".repeat(MAX_RESPONSE_TEXT_LENGTH + 1);
    assert.equal(checkSetValueBounds([value], undefined).ok, false);
  });

  it("rejects an over-long note", () => {
    const note = "x".repeat(MAX_NOTE_LENGTH + 1);
    assert.equal(checkSetValueBounds(["a"], note).ok, false);
  });
});
