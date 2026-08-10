import { SymptomEditor } from "@/components/QuestionnaireV2/structured/types/symptom/SymptomEditor";
import { toRequests } from "@/components/QuestionnaireV2/structured/types/symptom/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const symptomDefinition: StructuredTypeDefinition<"symptom"> = {
  type: "symptom",
  component: SymptomEditor,
  requires: ["patientId", "encounterId"],
  subjects: ["encounter"],
  // Symptom rows contain only plain JSON-serializable data, so they can be
  // restored from drafts without losing type information.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
};
