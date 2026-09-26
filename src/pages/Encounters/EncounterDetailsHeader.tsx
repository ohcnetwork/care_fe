import { format } from "date-fns";
import { ArrowLeft, History } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  ENCOUNTER_STATUS_COLORS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";

interface Props {
  encounter?: EncounterRead;
  isLoading: boolean;
  isHistorical: boolean;
  onReturnToCurrent: () => void;
}

export default function EncounterDetailsHeader({
  encounter,
  isLoading,
  isHistorical,
  onReturnToCurrent,
}: Props) {
  const { t } = useTranslation();

  return (
    <section
      aria-label={t("encounter")}
      className={cn(
        "rounded-xl border px-3 py-2.5 sm:px-4",
        isHistorical
          ? "border-amber-300 bg-amber-50"
          : "border-gray-200 bg-white",
      )}
    >
      {isHistorical && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
          <span
            role="status"
            className="flex items-center gap-2 text-sm font-semibold text-amber-900"
          >
            <History aria-hidden="true" className="size-4 shrink-0" />
            {t("viewing_another_encounter")}
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-8 border-amber-300 bg-white px-2.5 text-xs text-amber-950 shadow-xs hover:border-amber-400 hover:bg-amber-100"
            onClick={onReturnToCurrent}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey
              ) {
                // Preserve native activation despite the global Enter shortcut.
                event.stopPropagation();
              }
            }}
          >
            <ArrowLeft aria-hidden="true" />
            {t("back_to_current_encounter")}
          </Button>
        </div>
      )}
      {isLoading ? (
        <Skeleton className="h-9 w-full max-w-md" />
      ) : encounter ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              isHistorical
                ? "bg-amber-100 text-amber-800"
                : "bg-primary-50 text-primary-700",
            )}
          >
            {t(`encounter_class_short__${encounter.encounter_class}`)}
          </span>
          <span className="text-base font-semibold text-gray-950">
            {t(`encounter_class__${encounter.encounter_class}`)}
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-gray-600">
            <span className="wrap-anywhere">{encounter.facility.name}</span>
            {encounter.current_location && (
              <>
                <span aria-hidden="true" className="text-gray-300">
                  ·
                </span>
                <span className="wrap-anywhere">
                  {encounter.current_location.name}
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-gray-300">
              ·
            </span>
            <span className="whitespace-nowrap">
              {encounter.period.start &&
                format(new Date(encounter.period.start), "dd MMM yyyy")}
              {encounter.period.start && " – "}
              {encounter.period.end
                ? format(new Date(encounter.period.end), "dd MMM yyyy")
                : t("ongoing")}
            </span>
          </div>
          <Badge
            variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
            size="sm"
            className="sm:ml-auto"
          >
            {t(`encounter_status__${encounter.status}`)}
          </Badge>
        </div>
      ) : null}
    </section>
  );
}
