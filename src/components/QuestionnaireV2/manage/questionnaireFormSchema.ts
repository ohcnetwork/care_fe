import { TFunction } from "i18next";
import { z } from "zod";

import { slugValueSchema } from "@/types/base/slug/schema";
import {
  QUESTIONNAIRE_STATUSES,
  QuestionStatus,
} from "@/types/questionnaire/questionnaire";

/**
 * The `title`/`slug`/`description`/`status` validation shared by the three
 * questionnaire identity forms: the detail page uses it as-is, the create
 * page `.extend`s it with `subject_type`, and the clone dialog `.pick`s
 * title+slug. Building it allocates fresh Zod objects, so consumers wrap
 * the call (plus any `.extend`/`.pick`) in `useMemo(..., [t])`.
 */
export function questionnaireBasicSchema(t: TFunction) {
  return z.object({
    title: z.string().trim().min(1, t("field_required")),
    slug: slugValueSchema(),
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
