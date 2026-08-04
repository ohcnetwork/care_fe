import {
  MedicationRequestQuestion,
  validateMedicationRequestQuestion,
} from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";
import { PrescriptionStatus } from "@/types/emr/prescription/prescription";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { sanitizeNote, useLegacyResponseCallback } from "./adapt";

function MedicationRequestInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.patientId || !props.encounterId) return null;
  return (
    <MedicationRequestQuestion
      patientId={props.patientId}
      encounterId={props.encounterId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
      questionnaireId={props.questionnaireId}
      questionnaireSlug={props.questionnaireSlug}
    />
  );
}

export const medicationRequestDefinition: StructuredTypeDefinition<"medication_request"> =
  {
    type: "medication_request",
    component: MedicationRequestInput,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    draftPolicy: "exclude",
    contract: 1,
    validate: (medications, questionId) =>
      validateMedicationRequestQuestion(medications, questionId),
    buildRequests: async (
      medications,
      { patientId, encounterId, questionId },
    ) => {
      // Only modified rows submit (`dirty`); new rows get a prescription
      // shell with a generated alternate identifier.
      const dirtyMedications = medications.filter((m) => m.dirty);
      // `subjects` is encounter-only, so a patient is always in scope here
      // — narrowed rather than asserted (the context type is optional for
      // plugin types that declare a resource subject).
      if (!patientId || dirtyMedications.length === 0) return [];
      const prescriptionIdentifier = `${encounterId}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
      return [
        {
          url: `/api/v1/patient/${patientId}/medication/request/upsert/`,
          method: "POST",
          body: {
            datapoints: dirtyMedications.map((medication) => ({
              ...medication,
              ...(!medication.id && {
                create_prescription: {
                  ...medication.create_prescription,
                  status: PrescriptionStatus.active,
                  alternate_identifier: prescriptionIdentifier,
                },
              }),
              note: sanitizeNote(medication.note),
              encounter: encounterId,
              patient: patientId,
              requester: medication.requester?.id,
            })),
          },
          reference_id: structuredReferenceId("medication_request", questionId),
        },
      ];
    },
  };
