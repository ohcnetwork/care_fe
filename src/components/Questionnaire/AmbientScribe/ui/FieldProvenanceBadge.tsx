import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { FieldProvenance } from "@/components/Questionnaire/AmbientScribe/types";

interface FieldProvenanceBadgeProps {
  provenance?: FieldProvenance;
  className?: string;
}

/**
 * Tiny pill shown in the question label row:
 *  - "AI"     → field currently holds the value the scribe wrote.
 *  - "Edited" → doctor has modified a previously AI-filled value.
 *  - nothing  → no AI history.
 *
 * The "AI" pill briefly glows when `lastAiAt` changes (i.e. a fresh write).
 */
export function FieldProvenanceBadge({
  provenance,
  className,
}: FieldProvenanceBadgeProps) {
  const { t } = useTranslation();
  const [glow, setGlow] = useState(false);

  const lastAiAt = provenance?.lastAiAt;

  useEffect(() => {
    if (provenance?.status !== "ai" || !lastAiAt) {
      setGlow(false);
      return;
    }
    setGlow(true);
    const timer = setTimeout(() => setGlow(false), 1500);
    return () => clearTimeout(timer);
  }, [lastAiAt, provenance?.status]);

  if (!provenance) return null;

  if (provenance.status === "ai") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="purple"
            className={cn(
              "h-5 px-1.5 text-[10px] font-semibold uppercase tracking-wide transition-shadow",
              glow && "shadow-[0_0_0_3px_rgba(168,85,247,0.35)] animate-pulse",
              className,
            )}
          >
            <span>{t("ai_filled_field")}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          {t("ai_filled_field_tooltip")}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="orange"
          className={cn(
            "h-5 px-1.5 text-[10px] font-semibold uppercase tracking-wide",
            className,
          )}
        >
          <span>{t("ai_edited_field")}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top">{t("ai_edited_field_tooltip")}</TooltipContent>
    </Tooltip>
  );
}
