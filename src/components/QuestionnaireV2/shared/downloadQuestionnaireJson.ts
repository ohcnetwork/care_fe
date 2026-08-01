import { buildUpdateBody } from "@/components/QuestionnaireV2/shared/buildUpdateBody";

import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

/**
 * Serializes only the questionnaire *definition* — the same writable field
 * set `buildUpdateBody` selects (slug, version, code, questions, title,
 * description, status, subject_type) plus the id — via a data-URI +
 * programmatic `<a download>` click, so downloaded files stay compatible
 * with the import flow on either version. Never serialize the raw API
 * response here: it carries audit user objects (`created_by`/`updated_by`)
 * that must not leave the app in an export file.
 *
 * Lives in shared/ (lifted from the detail page) because both the detail
 * sidebar and the studio's form-settings panel offer the download.
 */
export function downloadQuestionnaireJson(questionnaire: QuestionnaireRead) {
  const definition = {
    id: questionnaire.id,
    ...buildUpdateBody(questionnaire, {}),
  };
  const dataStr = JSON.stringify(definition, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", `${questionnaire.slug}.json`);
  linkElement.click();
}
