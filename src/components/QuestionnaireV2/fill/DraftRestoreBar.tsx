import { History, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { formatDateTime } from "@/Utils/utils";

import type { LoadedFillDraft } from "./draft/fillDraftStore";

/**
 * Shown once per session when the page detects a local draft: prompts the
 * clinician to consciously accept or discard the stale-looking data
 * instead of silently seeding the form. Says when the draft was saved,
 * how many questionnaires beyond the route-mounted one it would bring
 * back, whether structured answers couldn't ride along, and offers
 * Resume (apply the draft) or Discard (delete it) — X only hides the
 * prompt and keeps the stored draft for the next visit.
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
  /** The session is mid-submit — Resume mutates stores and appends forms
   *  the in-flight batch was never composed with, and Discard clears the
   *  draft a successful submit is about to clear anyway (or shouldn't, on
   *  a failure); both gate on the same freeze as the rest of the canvas.
   *  Dismiss stays live — it only hides the prompt, no session mutation. */
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
