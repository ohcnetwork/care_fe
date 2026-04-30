import { useEffect, useRef } from "react";
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
                "mb-0.5 text-[10px] font-semibold uppercase tracking-wide",
                turn.speaker === "doctor"
                  ? "text-primary-800"
                  : turn.speaker === "patient"
                    ? "text-sky-800"
                    : "text-gray-500",
              )}
            >
              {speakerLabel}
            </div>
            <div className="text-gray-900 whitespace-pre-wrap break-words">
              {turn.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
