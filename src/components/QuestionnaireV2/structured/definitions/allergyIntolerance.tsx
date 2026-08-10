import { AllergyEditor } from "@/components/QuestionnaireV2/structured/types/allergyIntolerance/AllergyEditor";
import { toRequests } from "@/components/QuestionnaireV2/structured/types/allergyIntolerance/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const allergyIntoleranceDefinition: StructuredTypeDefinition<"allergy_intolerance"> =
  {
    type: "allergy_intolerance",
    component: AllergyEditor,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    // Allergy rows contain only plain JSON-serializable data, so they can be
    // restored from drafts without losing type information.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
  };
