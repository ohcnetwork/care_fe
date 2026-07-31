import {
  QuestionnaireRead,
  QuestionnaireUpdate,
} from "@/types/questionnaire/questionnaire";

/**
 * Builds a full-body update from the fetched questionnaire plus a partial
 * patch, so a PUT never drops fields the current tab doesn't own (e.g.
 * `questions`, `subject_type`, `version`).
 *
 * Only writable `QuestionnaireBase`/`QuestionnaireUpdate` fields are copied
 * from the fetched questionnaire — read-only response fields such as `id`,
 * `auth_context`, `internal_revision`, `created_by`, `updated_by`, and
 * `modified_date` must never be echoed back in the PUT body.
 *
 * `version` is defensively coerced to a string: the read endpoint can return
 * it as a raw number (seen with fixture data such as `0.1`), but the update
 * schema requires a string — without this, saving a title/status/reorder
 * change (which never touches `version`) would still 400.
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
