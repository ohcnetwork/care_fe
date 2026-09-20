import { QuestionType } from "@/types/questionnaire/question";

/** Types that never offer the Repeats flag. */
export const NON_REPEATABLE_TYPES: readonly QuestionType[] = [
  "boolean",
  "group",
  "display",
  "structured",
];
