import { TimeOfDeathEditor } from "@/components/QuestionnaireV2/structured/types/timeOfDeath/TimeOfDeathEditor";
import {
  rowSchema,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/timeOfDeath/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const timeOfDeathDefinition: StructuredTypeDefinition<"time_of_death"> =
  {
    type: "time_of_death",
    component: TimeOfDeathEditor,
    requires: [],
    subjects: ["patient", "encounter"],
    // A row is one ISO string, so it round-trips through JSON exactly.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
    // `rowSchema` documents which externally authored rows are accepted.
    rowSchema,
  };
