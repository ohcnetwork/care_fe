import { History, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { formatDateTime } from "@/Utils/utils";

import { DroppedAnswersList } from "./DroppedAnswersList";
import type { LoadedFillDraft } from "./draft/fillDraftStore";

/**
 * Prompts the clinician to accept or discard a detected local draft instead
 * of silently seeding the form. Dropped answers are listed before Resume so
 * drafted data is either restored or visibly accounted for.
 */
export function DraftRestoreBar({
  draft,
  onResume,
  onDiscard,
  onDismiss,
  frozen = false,
}: {
  draft: LoadedFillDraft;
  onResume: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
  /** Resume and Discard mutate session or draft state, so they share the
   *  canvas freeze during submit. Dismiss only hides the prompt. */
  frozen?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto mb-4 flex w-full max-w-3xl items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <History aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium">
          {t("fill_draft_resume_prompt", {
            time: formatDateTime(draft.savedAt, "DD MMM YYYY, hh:mm A"),
          })}
        </p>
        {draft.forms.length > 1 && (
          <p className="text-amber-800">
            {t("fill_draft_includes_added_forms", {
              count: draft.forms.length - 1,
            })}
          </p>
        )}
        {draft.structuredSkipped && (
          <p className="text-amber-800">{t("fill_draft_structured_skipped")}</p>
        )}
        {draft.dropped.length > 0 && (
          <div className="text-amber-800">
            <DroppedAnswersList dropped={draft.dropped} />
          </div>
        )}
      </div>
      <Button type="button" size="sm" onClick={onResume} disabled={frozen}>
        {t("resume")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDiscard}
        disabled={frozen}
      >
        {t("discard")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={t("close")}
        onClick={onDismiss}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
