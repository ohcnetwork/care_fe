import { AllergyEditor } from "@/components/QuestionnaireV2/structured/types/allergyIntolerance/AllergyEditor";
import {
  rowSchema,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/allergyIntolerance/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const allergyIntoleranceDefinition: StructuredTypeDefinition<"allergy_intolerance"> =
  {
    type: "allergy_intolerance",
    component: AllergyEditor,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    // D2: every structured type becomes draftable except `files` (D6). An
    // allergy row is plain, JSON-serializable data (a `Code`, a handful of
    // enum strings, an optional date/note) — no `Date`, `File`, or class
    // instance — so it round-trips through a draft exactly. The legacy
    // blanket "exclude" was a property of the conflated value array
    // (prefetched server rows mixed with user input, `dirty`-tracked by
    // hand), not of this type's data.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
    rowSchema,
  };
