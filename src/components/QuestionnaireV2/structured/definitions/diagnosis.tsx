import { DiagnosisEditor } from "@/components/QuestionnaireV2/structured/types/diagnosis/DiagnosisEditor";
import { toRequests } from "@/components/QuestionnaireV2/structured/types/diagnosis/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const diagnosisDefinition: StructuredTypeDefinition<"diagnosis"> = {
  type: "diagnosis",
  component: DiagnosisEditor,
  requires: ["patientId", "encounterId"],
  subjects: ["encounter"],
  // Diagnosis rows contain only plain JSON-serializable data, so they can be
  // restored from drafts without losing type information.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
};
