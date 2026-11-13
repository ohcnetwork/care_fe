import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { TooltipComponent } from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";

import { formatDateTime, formatName } from "@/Utils/utils";

interface ArchivedBadgeProps {
  className?: string;
  reason?: string;
  archivedBy?: Parameters<typeof formatName>[0];
  archivedAt?: string;
}

/**
 * "Archived" badge for file/report rows. Hovering, focusing or tapping it
 * reveals why, by whom and when the entry was archived.
 */
export function ArchivedBadge({
  className,
  reason,
  archivedBy,
  archivedAt,
}: ArchivedBadgeProps) {
  const { t } = useTranslation();

  return (
    <TooltipComponent
      className="max-w-xs"
      content={
        <div className="space-y-1.5 text-left whitespace-normal">
          <div>
            <p className="text-xs opacity-70">{t("archived_reason")}</p>
            <p className="break-words">{reason || "—"}</p>
          </div>
          {(archivedBy || archivedAt) && (
            <p className="text-xs opacity-70">
              {[
                archivedBy && `${t("archived_by")} ${formatName(archivedBy)}`,
                archivedAt &&
                  formatDateTime(archivedAt, "DD MMM YYYY, hh:mm A"),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      }
    >
      <button
        type="button"
        className={cn(
          "shrink-0 cursor-help rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
      >
        <Badge variant="neutral" size="sm">
          {t("archived")}
          <Info data-icon="inline-end" />
        </Badge>
      </button>
    </TooltipComponent>
  );
}
