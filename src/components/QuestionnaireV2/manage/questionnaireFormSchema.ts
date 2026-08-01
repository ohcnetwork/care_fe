import { TFunction } from "i18next";
import { z } from "zod";

import {
  QUESTIONNAIRE_STATUSES,
  QuestionStatus,
} from "@/types/questionnaire/questionnaire";

/**
 * Backend slug bounds (QuestionnaireCreateSpec) — shared by the create,
 * detail and clone forms plus the create page's slug auto-generation and the
 * clone dialog's `-copy` suffix clamp, so a bound change lands everywhere.
 */
export const SLUG_MIN_LENGTH = 5;
export const SLUG_MAX_LENGTH = 25;

/**
 * The `title`/`slug`/`description`/`status` validation shared by the three
 * questionnaire identity forms: the detail page uses it as-is, the create
 * page `.extend`s it with `subject_type`, and the clone dialog `.pick`s
 * title+slug. Building it allocates fresh Zod objects, so consumers wrap
 * the call (plus any `.extend`/`.pick`) in `useMemo(..., [t])`.
 */
export function questionnaireBasicSchema(t: TFunction) {
  const characterCountMessage = t("character_count_validation", {
    min: SLUG_MIN_LENGTH,
    max: SLUG_MAX_LENGTH,
  });
  return z.object({
    title: z.string().min(1, t("field_required")),
    slug: z
      .string()
      .min(SLUG_MIN_LENGTH, characterCountMessage)
      .max(SLUG_MAX_LENGTH, characterCountMessage)
      .regex(/^[-\w]+$/, t("slug_format_message")),
    description: z.string(),
    status: z.enum(QUESTIONNAIRE_STATUSES),
  });
}

/** The fields `BasicInformationCard` renders — form value shapes that embed
 *  the card (detail, create) extend this. */
export interface BasicInfoFormValues {
  title: string;
  slug: string;
  description: string;
}

/** The detail page's form values; lives here (not in the page) so child
 *  components don't import their prop types from the page that renders them. */
export interface DetailFormValues extends BasicInfoFormValues {
  status: QuestionStatus;
}
