import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Code } from "@/types/base/code/code";
import { ResponseValue } from "@/types/questionnaire/form";

import {
  coerceNumberValue,
  isEmptyQuantityEntry,
  nextQuantityEntry,
} from "./numericEntry";
import { replaceEntryAt } from "./withEntryAt";

const mg: Code = {
  code: "mg",
  display: "milligram",
  system: "http://unitsofmeasure.org",
};
const gram: Code = {
  code: "g",
  display: "gram",
  system: "http://unitsofmeasure.org",
};

describe("coerceNumberValue", () => {
  it("truncates a fractional entry on an integer question", () => {
    // step=1 only constrains the spinner arrows — a typed "2.5" arrives here
    // intact and must not reach the submit payload.
    assert.equal(coerceNumberValue("2.5", 2.5, true), 2);
    assert.equal(coerceNumberValue("-2.5", -2.5, true), -2);
  });

  it("keeps the fraction on a decimal question", () => {
    assert.equal(coerceNumberValue("2.5", 2.5, false), 2.5);
  });

  it("clears on empty or unparseable input", () => {
    assert.equal(coerceNumberValue("", Number.NaN, false), undefined);
    assert.equal(coerceNumberValue("", Number.NaN, true), undefined);
    assert.equal(coerceNumberValue("abc", Number.NaN, true), undefined);
  });

  it("keeps zero, which is a real answer", () => {
    assert.equal(coerceNumberValue("0", 0, true), 0);
  });
});

/** Everything a freshly mounted QuantityInput knows about the unit: what the
 *  stored entry carries, falling back to the question's authored default.
 *  There is no second source — the store outlives the mount — so every
 *  scenario below reads its unit state back through this. */
function unitStateOf(
  entry: ResponseValue | undefined,
  defaultUnit: Code | undefined,
) {
  return { unit: entry?.unit ?? defaultUnit, coding: entry?.coding };
}

describe("nextQuantityEntry", () => {
  it("attaches the authored default unit as both unit and coding when a value is typed", () => {
    assert.deepEqual(nextQuantityEntry("10", { unit: mg }), {
      type: "quantity",
      value: 10,
      unit: mg,
      coding: mg,
    });
  });

  it("lets the entry's own unit win over the authored default", () => {
    const picked: ResponseValue = {
      type: "quantity",
      value: undefined,
      unit: gram,
      coding: gram,
    };
    assert.deepEqual(nextQuantityEntry("250", unitStateOf(picked, mg)), {
      type: "quantity",
      value: 250,
      unit: gram,
      coding: gram,
    });
  });

  it("keeps the unit when the value is cleared", () => {
    // The unit is what the picker must still show, so it stays on the entry.
    // `entryIsAnswered` is what keeps the cleared field out of answers.
    const typed = nextQuantityEntry("10", { unit: mg });
    const cleared = nextQuantityEntry("", unitStateOf(typed, mg));
    assert.deepEqual(cleared, {
      type: "quantity",
      value: undefined,
      unit: mg,
      coding: mg,
    });
    assert.equal(isEmptyQuantityEntry(cleared), false);
  });

  it("survives a remount: a picked unit outlives clearing and retyping the value", () => {
    // A question hidden and re-shown by enable_when, a reload, a resumed
    // draft — the input comes back with nothing but the stored entry, and
    // 300 g must not silently become 300 mg.
    const typed = nextQuantityEntry("250", {
      unit: gram,
      coding: gram,
    });
    const remounted = unitStateOf(typed, mg);
    const cleared = nextQuantityEntry("", remounted);
    const retyped = nextQuantityEntry("300", unitStateOf(cleared, mg));
    assert.deepEqual(retyped, {
      type: "quantity",
      value: 300,
      unit: gram,
      coding: gram,
    });
  });

  it("empties the entry only when there is no unit to remember either", () => {
    const typed = nextQuantityEntry("10", { unit: undefined });
    const cleared = nextQuantityEntry("", unitStateOf(typed, undefined));
    assert.equal(isEmptyQuantityEntry(cleared), true);
  });

  it("mirrors a lone unit into coding on a cleared value", () => {
    assert.deepEqual(nextQuantityEntry("", { unit: gram }), {
      type: "quantity",
      value: undefined,
      unit: gram,
      coding: gram,
    });
  });

  it("treats unparseable input as cleared", () => {
    assert.deepEqual(nextQuantityEntry("abc", { unit: mg }), {
      type: "quantity",
      value: undefined,
      unit: mg,
      coding: mg,
    });
  });

  it("keeps zero with its unit", () => {
    assert.deepEqual(nextQuantityEntry("0", { unit: mg }), {
      type: "quantity",
      value: 0,
      unit: mg,
      coding: mg,
    });
  });
});

describe("quantity repeats", () => {
  it("clears one row without touching a sibling row's unit", () => {
    // Two rows of the same repeating question, each with its own unit.
    const rows: ResponseValue[] = [
      nextQuantityEntry("250", { unit: gram, coding: gram }),
      nextQuantityEntry("500", { unit: mg, coding: mg }),
    ];
    const cleared = replaceEntryAt(
      rows,
      0,
      nextQuantityEntry("", unitStateOf(rows[0], mg)),
    );
    assert.deepEqual(cleared[0], {
      type: "quantity",
      value: undefined,
      unit: gram,
      coding: gram,
    });
    assert.deepEqual(cleared[1], rows[1]);
  });
});
