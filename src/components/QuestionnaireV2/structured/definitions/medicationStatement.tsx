import {
  MedicationStatementQuestion,
  validateMedicationStatementQuestion,
} from "@/components/Questionnaire/QuestionTypes/MedicationStatementQuestion";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { useLegacyResponseCallback } from "./adapt";

function MedicationStatementInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.patientId || !props.encounterId) return null;
  return (
    <MedicationStatementQuestion
      patientId={props.patientId}
      encounterId={props.encounterId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
    />
  );
}

export const medicationStatementDefinition: StructuredTypeDefinition<"medication_statement"> =
  {
    type: "medication_statement",
    component: MedicationStatementInput,
    requires: ["patientId", "encounterId"],
    draftPolicy: "exclude",
    validate: (medications, questionId) =>
      validateMedicationStatementQuestion(medications, questionId),
    buildRequests: async (
      medications,
      { patientId, encounterId, questionId },
    ) => {
      if (medications.length === 0) return [];
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
