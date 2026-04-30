import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import type { TranscriptTurn } from "@/components/Questionnaire/AmbientScribe/types";

interface TranscriptViewProps {
  turns: TranscriptTurn[];
  className?: string;
}

export function TranscriptView({ turns, className }: TranscriptViewProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  // Per-turn override: which turns the doctor has chosen to display in
  // the source language instead of the (default) English translation.
  const [showSourceIds, setShowSourceIds] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleSource = useCallback((turnId: string) => {
    setShowSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(turnId)) next.delete(turnId);
      else next.add(turnId);
      return next;
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [turns]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    stickToBottomRef.current = nearBottom;
  };

  if (turns.length === 0) {
    return (
      <div
        className={cn(
          "flex-1 flex items-center justify-center px-4 text-center text-sm text-gray-500",
          className,
        )}
      >
        {t("transcript_empty_hint")}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2",
        className,
      )}
    >
      {turns.map((turn) => {
        const speakerLabel =
          turn.speaker === "doctor"
            ? t("doctor")
            : turn.speaker === "patient"
              ? t("patient")
              : "…";
        const canToggle =
          !!turn.originalText && turn.originalText !== turn.text;
        const showSource = canToggle && showSourceIds.has(turn.id);
        const displayText =
          showSource && turn.originalText ? turn.originalText : turn.text;
        return (
          <div
            key={turn.id}
            className={cn(
              "rounded-md border px-2.5 py-2 text-sm leading-snug transition-opacity",
              turn.status === "partial" && "opacity-70 italic",
              turn.speaker === "doctor"
                ? "border-primary-200 bg-primary-50/60"
                : turn.speaker === "patient"
                  ? "border-sky-200 bg-sky-50/60"
                  : "border-gray-200 bg-gray-50/60",
            )}
          >
            <div
              className={cn(
                "mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide",
                turn.speaker === "doctor"
                  ? "text-primary-800"
                  : turn.speaker === "patient"
                    ? "text-sky-800"
                    : "text-gray-500",
              )}
            >
              <span>{speakerLabel}</span>
              {turn.translating && (
                <span
                  aria-hidden
                  className="relative inline-flex size-1.5"
                  title={t("translating") ?? "Translating…"}
                >
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary-500" />
                </span>
              )}
              {canToggle && (
                <button
                  type="button"
                  onClick={() => toggleSource(turn.id)}
                  title={
                    showSource
                      ? (t("show_translated") ?? "Show English translation")
                      : (t("show_source") ?? "Show original transcript")
                  }
                  aria-pressed={!showSource}
                  className={cn(
                    "ml-auto inline-flex items-center rounded px-1.5 py-px",
                    "normal-case tracking-normal text-[9px] font-semibold",
                    "transition-colors cursor-pointer select-none",
                    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-400",
                    showSource
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-primary-100 text-primary-700 hover:bg-primary-200",
                  )}
                >
                  {showSource ? (t("source") ?? "Source") : "EN"}
                </button>
              )}
            </div>
            <div
              className={cn(
                "text-gray-900 whitespace-pre-wrap break-words",
                "transition-opacity duration-200",
                turn.translating && "text-gray-500",
              )}
            >
              {displayText}
            </div>
          </div>
        );
      })}
    </div>
  );
}
