import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import type { ScribeHandle } from "./types";
import { AudioWaveform } from "./ui/AudioWaveform";
import { MicButton } from "./ui/MicButton";
import { SessionTimer } from "./ui/SessionTimer";
import { TranscriptView } from "./ui/TranscriptView";

interface AmbientScribePanelProps {
  scribe: ScribeHandle;
  className?: string;
  embedded?: boolean;
}

export function AmbientScribePanel({
  scribe,
  className,
  embedded,
}: AmbientScribePanelProps) {
  const { t } = useTranslation();
  const isListening = scribe.status === "listening";

  const statusLabel = (() => {
    switch (scribe.status) {
      case "connecting":
        return t("connecting");
      case "listening":
        return t("listening");
      case "paused":
        return t("paused");
      case "error":
        return t("scribe_error");
      default:
        return t("idle");
    }
  })();

  return (
    <aside
      className={cn(
        "flex flex-col h-full xl:h-[calc(100vh-3rem)] min-h-0 bg-white border border-primary-300 rounded-lg overflow-hidden shadow-lg shadow-primary-500/20",
        !embedded && "shadow-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 bg-linear-to-r from-primary-100/20 to-primary-100/50">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-sm font-semibold text-primary-500 leading-tight">
              {t("ambient_scribe")}
            </div>
            <div className="text-[11px] text-gray-500 leading-tight">
              {t("ambient_scribe_subtitle")}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full border",
            isListening
              ? "bg-primary-50 text-primary-700 border-primary-200"
              : scribe.status === "connecting"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : scribe.status === "error"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-gray-50 text-gray-600 border-gray-200",
          )}
        >
          {isListening && (
            <span aria-hidden className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75 animate-ping" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary-500" />
            </span>
          )}
          {statusLabel}
        </span>
      </header>

      <div className="flex flex-col items-center gap-3 px-4 py-5 border-b border-gray-100">
        <MicButton
          status={scribe.status}
          ariaLabel={isListening ? t("stop_listening") : t("start_listening")}
          onClick={() => {
            if (isListening || scribe.status === "connecting") {
              scribe.stop();
            } else {
              scribe.start().catch(() => {
                // errors surface via scribe.errorMessage
              });
            }
          }}
        />
        <SessionTimer startedAt={scribe.sessionStartedAt} />
        <AudioWaveform
          waveform={scribe.waveform}
          active={isListening}
          className="max-w-[240px]"
        />
        <div className="text-xs text-gray-600">
          {isListening ? t("listening_hint") : t("start_listening_hint")}
        </div>
      </div>

      {scribe.errorMessage && (
        <div className="flex items-start gap-2 mx-3 my-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-xs text-red-800">
          <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
          <span className="break-words">{scribe.errorMessage}</span>
        </div>
      )}

      <TranscriptView turns={scribe.transcript} />

      <footer className="flex items-center justify-between gap-2 px-3 py-2 border-t border-gray-100 bg-gray-50/60">
        <span className="text-[11px] text-gray-500">
          {t("ambient_scribe_autofill_note")}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={scribe.runFillNow}
          disabled={scribe.transcript.length === 0}
        >
          {t("apply_now")}
        </Button>
      </footer>
    </aside>
  );
}
