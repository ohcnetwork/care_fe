import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { Code } from "@/types/base/code/code";

import { entryIsAnswered } from "./answeredEntry";

const mg: Code = {
  code: "mg",
  display: "milligram",
  system: "http://unitsofmeasure.org",
};

describe("entryIsAnswered", () => {
  it("does not count a quantity that carries only a unit", () => {
    // What a cleared quantity field looks like: the picker still shows the
    // unit, so the entry still carries it. Counting that as an answer lets a
    // visibly empty required question pass validation and posts a valueless
    // quantity the backend rejects for the whole atomic batch.
    assert.equal(
      entryIsAnswered({
        type: "quantity",
        value: undefined,
        unit: mg,
        coding: mg,
      }),
      false,
    );
  });

  it("counts a quantity with a number, zero included", () => {
    assert.equal(
      entryIsAnswered({ type: "quantity", value: 0, unit: mg, coding: mg }),
      true,
    );
    assert.equal(
      entryIsAnswered({ type: "quantity", value: 300, unit: mg, coding: mg }),
      true,
    );
  });

  it("counts a coding recorded without a display string", () => {
    // Valueset selections store the code; the display may be missing.
    assert.equal(
      entryIsAnswered({
        type: "string",
        value: undefined,
        coding: { code: "38341003", display: "", system: "http://snomed.info" },
      }),
      true,
    );
  });

  it("does not count an empty scalar or an empty row array", () => {
    assert.equal(entryIsAnswered({ type: "string", value: "" }), false);
    assert.equal(entryIsAnswered({ type: "number", value: undefined }), false);
    assert.equal(entryIsAnswered({ type: "symptom", value: [] }), false);
  });
});
