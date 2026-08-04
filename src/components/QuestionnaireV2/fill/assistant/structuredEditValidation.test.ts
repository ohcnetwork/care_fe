import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";

import {
  rowSchemaOf,
  validateStructuredPatch,
} from "./structuredEditValidation";

// A synthetic row schema standing in for what a real ported type's
// `model.ts` will eventually publish (see this module's "HONESTY NOTE" —
// no shipped type has one yet, so this is deliberately not borrowed from
// a real type).
const testRowSchema = z
  .object({
    severity: z.enum(["mild", "moderate", "severe"]),
    onset_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    count: z.number().int(),
  })
  // `.strict()` is what actually rejects an unknown field — a plain
  // `z.object()` silently STRIPS extras instead of failing. A real type's
  // published row schema needs the same `.strict()` to get the "unknown
  // fields rejected" guarantee this choke point is documented to give.
  .strict();

describe("validateStructuredPatch — the structured-write choke point", () => {
  it("rejects outright when no schema is published (fail-closed, not fail-open)", () => {
    const result = validateStructuredPatch(undefined, { anything: "goes" });
    assert.equal(result.ok, false);
  });

  it("accepts a well-formed row", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      onset_date: "2024-06-15",
      count: 2,
    });
    assert.equal(result.ok, true);
  });

  it("rejects an unknown field", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      onset_date: "2024-06-15",
      count: 2,
      not_a_real_field: "surprise",
    });
    assert.equal(result.ok, false);
  });

  it("rejects a bad enum value", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "catastrophic",
      onset_date: "2024-06-15",
      count: 2,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a non-integral count (the same integer rule as the plain-value choke point)", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      onset_date: "2024-06-15",
      count: 2.5,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a malformed date field", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      onset_date: "06/15/2024",
      count: 2,
    });
    assert.equal(result.ok, false);
  });

  it("rejects a missing required field", () => {
    const result = validateStructuredPatch(testRowSchema, {
      severity: "mild",
      count: 2,
    });
    assert.equal(result.ok, false);
  });
});

describe("rowSchemaOf — duck-typed lookup, forward-compatible with an as-yet-unpublished field", () => {
  it("returns undefined for a definition with no rowSchema", () => {
    assert.equal(rowSchemaOf({ type: "allergy_intolerance" }), undefined);
  });

  it("returns undefined for a non-object", () => {
    assert.equal(rowSchemaOf(undefined), undefined);
    assert.equal(rowSchemaOf(null), undefined);
  });

  it("picks up a rowSchema the moment a definition carries one", () => {
    const definition = { type: "acme.thing", rowSchema: testRowSchema };
    assert.equal(rowSchemaOf(definition), testRowSchema);
  });
});
