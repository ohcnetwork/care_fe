// No imports: the router's search schemas load this file at startup.

/** Runtime source of truth for `SubjectType` — option lists and zod enums
 *  derive from this array so a new subject type cannot silently miss them. */
export const SUBJECT_TYPES = [
  "patient",
  "encounter",
  "referral",
  "location",
  "device",
  "facility",
] as const;

/** Runtime source of truth for `QuestionStatus` — status option lists, zod
 *  enums and the list page's tabs all derive from this array. */
export const QUESTIONNAIRE_STATUSES = ["active", "draft", "retired"] as const;
