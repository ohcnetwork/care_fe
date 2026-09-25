import { validateMedicationStatementQuestion } from "@/components/Questionnaire/QuestionTypes/MedicationStatementQuestion";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import { MedicationStatementInput } from "@/components/QuestionnaireV2/structured/inputs/MedicationStatementInput";

export const medicationStatementDefinition: StructuredTypeDefinition<"medication_statement"> =
  {
    type: "medication_statement",
    component: MedicationStatementInput,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    draftPolicy: "serialize",
    validate: (medications, questionId) =>
      validateMedicationStatementQuestion(medications, questionId),
    buildRequests: async (
      medications,
      { patientId, encounterId, questionId },
    ) => {
      // `subjects` is encounter-only, so a patient is always in scope here
      // — narrowed rather than asserted (the context type is optional for
      // plugin types that declare a resource subject).
      if (!patientId || medications.length === 0) return [];
      return [
        {
          url: `/api/v1/patient/${patientId}/medication/statement/upsert/`,
          method: "POST",
          body: {
            datapoints: medications.map((medication) => ({
              ...medication,
              encounter: encounterId,
              patient: patientId,
            })),
          },
          reference_id: structuredReferenceId(
            "medication_statement",
            questionId,
          ),
        },
      ];
    },
  };
