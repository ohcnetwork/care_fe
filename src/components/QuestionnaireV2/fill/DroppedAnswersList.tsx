import { useTranslation } from "react-i18next";

import type { DraftDropReason, DroppedDraftAnswer } from "./draft/draftMerge";

/** i18n key per {@link DraftDropReason} — the short clause appended after
 *  each dropped answer's label. */
const DROP_REASON_KEY: Record<DraftDropReason, string> = {
  question_removed: "fill_draft_drop_reason_question_removed",
  type_changed: "fill_draft_drop_reason_type_changed",
  option_removed: "fill_draft_drop_reason_option_removed",
};

/**
 * Names every answer a draft restore could not carry onto the current
 * questionnaire. Both restore surfaces render this: the local draft's bar
 * (before the clinician accepts) and the resumed server draft's notice
 * (after seeding, since that path has no accept gate). Callers own the
 * surrounding surface; this is the shared "what was lost" list.
 */
export function DroppedAnswersList({
  dropped,
}: {
  dropped: DroppedDraftAnswer[];
}) {
  const { t } = useTranslation();
  return (
    <>
      <p>{t("fill_draft_answers_dropped", { count: dropped.length })}</p>
      <ul className="list-inside list-disc">
        {dropped.map((entry) => (
          <li key={entry.questionId}>
            {entry.label} — {t(DROP_REASON_KEY[entry.reason])}
          </li>
        ))}
      </ul>
    </>
  );
}
