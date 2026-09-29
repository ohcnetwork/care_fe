import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasDuplicateClinicalCode } from "./conditionValidation";

describe("diagnosis and symptom duplicate validation", () => {
  it("prevents repeating an existing clinical code", () => {
    const records = [
      { code: { code: "386661006" }, verification_status: "confirmed" },
    ];
    assert.equal(hasDuplicateClinicalCode(records, "386661006"), true);
    assert.equal(hasDuplicateClinicalCode(records, "49727002"), false);
  });

  it("allows recording a code again after its earlier entry was marked in error", () => {
    const records = [
      { code: { code: "386661006" }, verification_status: "entered_in_error" },
    ];
    assert.equal(hasDuplicateClinicalCode(records, "386661006"), false);
    assert.equal(
      hasDuplicateClinicalCode(
        [
          ...records,
          { code: { code: "386661006" }, verification_status: "unconfirmed" },
        ],
        "386661006",
      ),
      true,
    );
  });
});
