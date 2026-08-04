import { SymptomEditor } from "@/components/QuestionnaireV2/structured/types/symptom/SymptomEditor";
import { toRequests } from "@/components/QuestionnaireV2/structured/types/symptom/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const symptomDefinition: StructuredTypeDefinition<"symptom"> = {
  type: "symptom",
  component: SymptomEditor,
  requires: ["patientId", "encounterId"],
  subjects: ["encounter"],
  // D2: every structured type becomes draftable except `files` (D6). A
  // symptom row is plain, JSON-serializable data (a `Code`, a handful of
  // enum strings, an onset date, an optional note) — no `Date`, `File`, or
  // class instance — so it round-trips through a draft exactly. The legacy
  // blanket "exclude" was a property of the conflated value array
  // (prefetched server rows mixed with user input), not of this type's data
  // — mirrors `allergy_intolerance`'s identical reasoning.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
};
