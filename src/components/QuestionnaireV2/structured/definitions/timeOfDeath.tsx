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
    // D2: every structured type becomes draftable except `files` (D6). The
    // legacy blanket "exclude" was a property of the conflated value array
    // — prefetched rows mixed with user input — not of this type's data. A
    // row is one ISO string; it round-trips through JSON exactly.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
    // Spec §6 A2 — the assistant's row validation guard (`model.ts`'s own
    // doc comment on `rowSchema` for what it accepts/rejects).
    rowSchema,
  };
