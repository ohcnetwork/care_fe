import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { reachableContextPaths } from "@/components/QuestionnaireV2/builder/actionVariables";
import type { ActionInstructionDefinition } from "@/types/questionnaire/actions";

import { isInstructionCompatible } from "./instructionCompatibility";

const instruction = (
  slug: string,
  context: string,
): ActionInstructionDefinition => ({
  slug,
  context,
  input_schema: {},
  output_schema: {},
  instruction_type: "PERFORMED",
});

describe("trigger-compatible instructions", () => {
  const appointmentPaths = reachableContextPaths("Appointment", [
    {
      context_type: "Appointment",
      field: "patient",
      target_context_type: "Patient",
      evaluation: "static",
    },
  ]);

  it("allows patient instructions reached through an appointment, but no encounter instructions", () => {
    assert.equal(
      isInstructionCompatible(
        instruction("tag_patient", "Patient"),
        appointmentPaths,
      ),
      true,
    );
    assert.equal(
      isInstructionCompatible(
        instruction("tag_encounter", "Encounter"),
        appointmentPaths,
      ),
      false,
    );
    assert.equal(
      isInstructionCompatible(
        instruction("set_encounter_priority", "Encounter"),
        appointmentPaths,
      ),
      false,
    );
  });

  it("allows messages on every trigger because they do not read the context object", () => {
    assert.equal(
      isInstructionCompatible(
        instruction("show_message", "EncounterQuestionnaire"),
        appointmentPaths,
      ),
      true,
    );
    assert.equal(
      isInstructionCompatible(instruction("logging", "Appointment"), [
        { path: "self", contextType: "Patient" },
      ]),
      true,
    );
  });

  it("requires an extension instruction's declared context to be reachable", () => {
    assert.equal(
      isInstructionCompatible(
        instruction("custom_notification", "Encounter"),
        appointmentPaths,
      ),
      false,
    );
    assert.equal(
      isInstructionCompatible(
        instruction("custom_patient_instruction", "Patient"),
        appointmentPaths,
      ),
      true,
    );
  });
});
