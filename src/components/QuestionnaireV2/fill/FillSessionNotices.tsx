import { AlertCircle, History, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { DraftRestoreBar } from "./DraftRestoreBar";
import { DroppedAnswersList } from "./DroppedAnswersList";
import type { DroppedDraftAnswer } from "./draft/draftMerge";
import type { LoadedFillDraft } from "./draft/fillDraftStore";

interface FillSessionNoticesProps {
  questionnaireStale: boolean;
  frozen: boolean;
  resumeLocalDraft: boolean;
  localDraft?: LoadedFillDraft;
  serverDraftDropped?: DroppedDraftAnswer[];
  restoredDraft?: LoadedFillDraft;
  onResumeDraft: () => void;
  onDiscardDraft: () => void;
  onDismissRestore: () => void;
  contextRefreshFailed: boolean;
  isRetryingContext: boolean;
  onRetryContext: () => void;
}

/** Recovery and refresh notices never replace or reset the mounted answer stores. */
export function FillSessionNotices({
  questionnaireStale,
  frozen,
  resumeLocalDraft,
  localDraft,
  serverDraftDropped,
  restoredDraft,
  onResumeDraft,
  onDiscardDraft,
  onDismissRestore,
  contextRefreshFailed,
  isRetryingContext,
  onRetryContext,
}: FillSessionNoticesProps) {
  const { t } = useTranslation();
  const [reloadBannerDismissed, setReloadBannerDismissed] = useState(false);
  const [dropNoticeDismissed, setDropNoticeDismissed] = useState(false);
  const dropped =
    serverDraftDropped ??
    (resumeLocalDraft ? localDraft?.dropped : undefined) ??
    [];
  const structuredSkipped = resumeLocalDraft && localDraft?.structuredSkipped;
  return (
    <>
      {contextRefreshFailed && (
        <Alert variant="destructive" className="mx-auto mb-4 w-full max-w-3xl">
          <AlertCircle />
          <AlertDescription>
            <p>{t("fill_context_refresh_failed")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={isRetryingContext}
              onClick={onRetryContext}
            >
              {t("try_again")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {/* A hard reload flushes the draft before remounting against the new
        questionnaire. Never hot-swap the live provider's questionnaire. */}
      {questionnaireStale && !reloadBannerDismissed && (
        <div className="mx-auto mb-4 flex w-full max-w-3xl items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <div className="min-w-0 flex-1">
            <p>{t("fill_questionnaire_updated_banner")}</p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={frozen}
          >
            {t("fill_questionnaire_reload")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t("close")}
            onClick={() => setReloadBannerDismissed(true)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      {(dropped.length > 0 || structuredSkipped) && !dropNoticeDismissed && (
        <div className="mx-auto mb-4 flex w-full max-w-3xl items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <History aria-hidden className="mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1">
            {structuredSkipped && <p>{t("fill_draft_structured_skipped")}</p>}
            {dropped.length > 0 && <DroppedAnswersList dropped={dropped} />}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={t("close")}
            onClick={() => setDropNoticeDismissed(true)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      {restoredDraft && !resumeLocalDraft && (
        <DraftRestoreBar
          draft={restoredDraft}
          onResume={onResumeDraft}
          onDiscard={onDiscardDraft}
          onDismiss={onDismissRestore}
          frozen={frozen}
        />
      )}
    </>
  );
}
