import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import { TimeOfDeathInput } from "@/components/QuestionnaireV2/structured/inputs/TimeOfDeathInput";

export const timeOfDeathDefinition: StructuredTypeDefinition<"time_of_death"> =
  {
    type: "time_of_death",
    component: TimeOfDeathInput,
    requires: [],
    subjects: ["patient", "encounter"],
    draftPolicy: "serialize",
    buildRequests: async (timeOfDeaths, { patientId, questionId, path }) => {
      if (!patientId) return [];
      if (timeOfDeaths.length > 1) {
        throw new Error(
          "A time of death question cannot hold more than one entry",
        );
      }
      return timeOfDeaths.map((deceasedDatetime) => ({
        url: `/api/v1/patient/${patientId}/`,
        method: "PUT" as const,
        body: {
          deceased_datetime: deceasedDatetime,
        },
        reference_id: structuredReferenceId("time_of_death", questionId, path),
      }));
    },
  };
