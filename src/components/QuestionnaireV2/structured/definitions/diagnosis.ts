import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { sanitizeNote } from "./adapt";

import { DiagnosisInput } from "@/components/QuestionnaireV2/structured/inputs/DiagnosisInput";

export const diagnosisDefinition: StructuredTypeDefinition<"diagnosis"> = {
  type: "diagnosis",
  component: DiagnosisInput,
  requires: ["patientId", "encounterId"],
  subjects: ["encounter"],
  draftPolicy: "serialize",
  buildRequests: async (
    diagnoses,
    { patientId, encounterId, questionId, path },
  ) => {
    const dirty = diagnoses.filter((diagnosis) => diagnosis.dirty);
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
        reference_id: structuredReferenceId("diagnosis", questionId, path),
      },
    ];
  },
};
