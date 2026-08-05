import {
  QuestionnaireRead,
  QuestionnaireUpdate,
} from "@/types/questionnaire/questionnaire";

/**
 * Builds a full-body update from the fetched questionnaire plus a partial
 * patch, copying only writable fields. `version` is coerced to a string
 * because the read endpoint may return a number while updates require string.
 */
export function buildUpdateBody(
  questionnaire: QuestionnaireRead,
  patch: Partial<QuestionnaireUpdate>,
): QuestionnaireUpdate {
  const writable: QuestionnaireUpdate = {
    slug: questionnaire.slug,
    version:
      questionnaire.version == null
        ? questionnaire.version
        : String(questionnaire.version),
    code: questionnaire.code,
    questions: questionnaire.questions,
    title: questionnaire.title,
    description: questionnaire.description,
    status: questionnaire.status,
    subject_type: questionnaire.subject_type,
  };
  return {
    ...writable,
    ...patch,
  };
}
