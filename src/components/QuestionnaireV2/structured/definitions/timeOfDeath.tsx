import { TimeOfDeathEditor } from "@/components/QuestionnaireV2/structured/types/timeOfDeath/TimeOfDeathEditor";
import { toRequests } from "@/components/QuestionnaireV2/structured/types/timeOfDeath/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const timeOfDeathDefinition: StructuredTypeDefinition<"time_of_death"> =
  {
    type: "time_of_death",
    component: TimeOfDeathEditor,
    requires: [],
    subjects: ["patient", "encounter"],
    // D2: every structured type becomes draftable except `files` (D6). The
    // legacy blanket "exclude" was a property of the conflated value array
    // — prefetched rows mixed with user input — not of this type's data. A
    // row is one ISO string; it round-trips through JSON exactly.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
  };
