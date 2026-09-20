import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { sanitizeNote } from "./adapt";

import { AllergyIntoleranceInput } from "@/components/QuestionnaireV2/structured/inputs/AllergyIntoleranceInput";

export const allergyIntoleranceDefinition: StructuredTypeDefinition<"allergy_intolerance"> =
  {
    type: "allergy_intolerance",
    component: AllergyIntoleranceInput,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    draftPolicy: "serialize",
    buildRequests: async (
      allergies,
      { patientId, encounterId, questionId },
    ) => {
      // `subjects` is encounter-only, so a patient is always in scope here
      // — narrowed rather than asserted (the context type is optional for
      // plugin types that declare a resource subject).
      if (!patientId || !encounterId || allergies.length === 0) return [];
      return [
        {
          url: `/api/v1/patient/${patientId}/allergy_intolerance/upsert/`,
          method: "POST",
          body: {
            datapoints: allergies.map((allergy) => ({
              ...allergy,
              note: sanitizeNote(allergy.note),
              encounter: encounterId,
            })),
          },
          reference_id: structuredReferenceId(
            "allergy_intolerance",
            questionId,
          ),
        },
      ];
    },
  };
