import { DiagnosisEditor } from "@/components/QuestionnaireV2/structured/types/diagnosis/DiagnosisEditor";
import {
  rowSchema,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/diagnosis/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const diagnosisDefinition: StructuredTypeDefinition<"diagnosis"> = {
  type: "diagnosis",
  component: DiagnosisEditor,
  requires: ["patientId", "encounterId"],
  subjects: ["encounter"],
  // D2: every structured type becomes draftable except `files` (D6). A
  // diagnosis row is plain, JSON-serializable data (a `Code`, a handful of
  // enum strings, an optional onset date/note) — no `Date`, `File`, or class
  // instance — so it round-trips through a draft exactly. The legacy
  // blanket "exclude" was a property of the conflated value array
  // (prefetched server rows mixed with user input, `dirty`-tracked by hand),
  // not of this type's data.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
  rowSchema,
};
