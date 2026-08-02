import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

/** One questionnaire in a fill session. `key` is the questionnaire id —
 *  adding a questionnaire already in the session is a no-op (legacy
 *  dedupe). The primary (route-mounted) form cannot be removed. */
export interface FillFormEntry {
  key: string;
  questionnaire: QuestionnaireRead;
  isPrimary: boolean;
  /** Creation-time store seed (draft resume for added forms). */
  initialResponses?: Record<string, QuestionnaireResponse>;
}
