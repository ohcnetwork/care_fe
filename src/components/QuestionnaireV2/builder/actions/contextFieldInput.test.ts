import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { contextFieldInput } from "./contextFieldInput";

const patientField = (field: string) => ({
  ref: `patient.${field}`,
  segments: ["patient", field],
  ownerContextType: "Patient",
});

describe("patient action field inputs", () => {
  it("keeps numeric-looking names and phone numbers as strings while typing age and deceased correctly", () => {
    assert.equal(
      contextFieldInput(patientField("phone_number"))?.shape,
      "text",
    );
    assert.equal(contextFieldInput(patientField("name"))?.shape, "text");
    assert.equal(contextFieldInput(patientField("age"))?.shape, "number");
    assert.equal(
      contextFieldInput(patientField("year_of_birth"))?.shape,
      "number",
    );
    assert.equal(contextFieldInput(patientField("deceased"))?.shape, "boolean");
  });

  it("uses patient registration's persisted blood group and gender values", () => {
    assert.ok(
      contextFieldInput(patientField("blood_group"))?.options?.some(
        ({ value, label }) => value === "AB_negative" && label === "AB-",
      ),
    );
    assert.ok(
      contextFieldInput(patientField("gender"))?.options?.some(
        ({ value }) => value === "non_binary",
      ),
    );
    assert.equal(contextFieldInput(patientField("date_of_birth"))?.date, true);
  });

  it("does not guess types for extension fields or other context models", () => {
    assert.equal(contextFieldInput(patientField("custom")), undefined);
    assert.equal(
      contextFieldInput({
        ...patientField("age"),
        ownerContextType: "CustomContext",
      }),
      undefined,
    );
  });
});
