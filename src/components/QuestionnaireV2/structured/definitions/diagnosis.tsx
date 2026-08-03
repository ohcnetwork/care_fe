import { DiagnosisQuestion } from "@/components/Questionnaire/QuestionTypes/DiagnosisQuestion";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { sanitizeNote, useLegacyResponseCallback } from "./adapt";

function DiagnosisInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.patientId || !props.encounterId) return null;
  return (
    <DiagnosisQuestion
      patientId={props.patientId}
      encounterId={props.encounterId}
      question={props.question}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
    />
  );
}

export const diagnosisDefinition: StructuredTypeDefinition<"diagnosis"> = {
  type: "diagnosis",
  component: DiagnosisInput,
  requires: ["patientId", "encounterId"],
  subjects: ["encounter"],
  draftPolicy: "exclude",
  buildRequests: async (diagnoses, { patientId, encounterId, questionId }) => {
    // Only edited rows submit — prefetched server rows ride along in the
    // response values and must not re-upsert untouched.
    const dirty = diagnoses.filter((diagnosis) => diagnosis.dirty);
    // `subjects` is encounter-only, so a patient is always in scope here —
    // narrowed rather than asserted (the context type is optional for
    // plugin types that declare a resource subject).
    if (!patientId || !encounterId || dirty.length === 0) return [];
    return [
      {
        url: `/api/v1/patient/${patientId}/diagnosis/upsert/`,
        method: "POST",
        body: {
          datapoints: dirty.map((diagnosis) => ({
            ...diagnosis,
            note: sanitizeNote(diagnosis.note),
            encounter: encounterId,
          })),
        },
        reference_id: structuredReferenceId("diagnosis", questionId),
      },
    ];
  },
};
