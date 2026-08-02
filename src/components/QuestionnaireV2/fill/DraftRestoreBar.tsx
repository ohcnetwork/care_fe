import { History, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { formatDateTime } from "@/Utils/utils";

import type { LoadedFillDraft } from "./draft/fillDraftStore";

/**
 * Shown once per session when the page detects a local draft: prompts the
 * clinician to consciously accept or discard the stale-looking data
 * instead of silently seeding the form. Says when the draft was saved,
 * whether structured answers couldn't ride along, and offers Resume
 * (apply the draft) or Discard (delete it) — X only hides the prompt and
 * keeps the stored draft for the next visit.
 */
export function DraftRestoreBar({
  draft,
  onResume,
  onDiscard,
  onDismiss,
}: {
  draft: LoadedFillDraft;
  onResume: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
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
        {draft.structuredSkipped && (
          <p className="text-amber-800">{t("fill_draft_structured_skipped")}</p>
        )}
      </div>
      <Button type="button" size="sm" onClick={onResume}>
        {t("resume")}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onDiscard}>
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
