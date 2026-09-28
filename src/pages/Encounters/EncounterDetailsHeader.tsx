import { format } from "date-fns";
import { ArrowLeft, History, SquarePen } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/pages/Encounters/EncounterProperties";

import {
  ENCOUNTER_PRIORITY_COLORS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";

interface Props {
  encounter?: EncounterRead;
  isLoading: boolean;
  isHistorical: boolean;
  onReturnToCurrent: () => void;
  editUrl?: string;
  currentFacilityId?: string;
}

export default function EncounterDetailsHeader({
  encounter,
  isLoading,
  isHistorical,
  onReturnToCurrent,
  editUrl,
  currentFacilityId,
}: Props) {
  const { t } = useTranslation();
  const showFacility =
    isHistorical || encounter?.facility.id !== currentFacilityId;
  const periodLabel = encounter
    ? [
        format(
          new Date(encounter.period.start || encounter.created_date),
          "dd MMM",
        ),
        encounter.period.end
          ? format(new Date(encounter.period.end), "dd MMM")
          : t("ongoing"),
      ].join(" – ")
    : "";

  return (
    <section
      aria-label={t("encounter")}
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
      className={cn(
        "rounded-xl border px-3 py-2",
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
          >
            <ArrowLeft aria-hidden="true" />
            {t("back_to_current_encounter")}
          </Button>
        </div>
      )}
      {isLoading ? (
        <Skeleton className="h-9 w-full max-w-md" />
      ) : encounter ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-gray-950">
            {t(`encounter_class__${encounter.encounter_class}`)}
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-gray-600">
            {showFacility && (
              <span className="wrap-anywhere">{encounter.facility.name}</span>
            )}
            {encounter.current_location && (
              <>
                {showFacility && (
                  <span aria-hidden="true" className="text-gray-300">
                    ·
                  </span>
                )}
                <span className="wrap-anywhere">
                  {encounter.current_location.name}
                </span>
              </>
            )}
            {(showFacility || encounter.current_location) && (
              <span aria-hidden="true" className="h-5 w-px bg-gray-300" />
            )}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`${t("encounter_dates")}: ${periodLabel}`}
                  className="rounded-sm text-left underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                >
                  {periodLabel}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto max-w-[calc(100vw-2rem)]"
              >
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">{t("start_date")}</dt>
                    <dd className="font-medium text-gray-950">
                      {encounter.period.start
                        ? format(
                            new Date(encounter.period.start),
                            "dd MMM yyyy, hh:mm a",
                          )
                        : t("not_specified")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">{t("end_date")}</dt>
                    <dd className="font-medium text-gray-950">
                      {encounter.period.end
                        ? format(
                            new Date(encounter.period.end),
                            "dd MMM yyyy, hh:mm a",
                          )
                        : t("ongoing")}
                    </dd>
                  </div>
                  {!encounter.period.start && (
                    <div>
                      <dt className="text-gray-500">{t("created_date")}</dt>
                      <dd className="font-medium text-gray-950">
                        {format(
                          new Date(encounter.created_date),
                          "dd MMM yyyy, hh:mm a",
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge encounter={encounter} />
            <Badge
              variant={
                encounter.priority === "routine"
                  ? "pink"
                  : ENCOUNTER_PRIORITY_COLORS[encounter.priority]
              }
              className="min-h-7 px-2"
            >
              {t(`encounter_priority__${encounter.priority}`)}
            </Badge>
          </div>
          {editUrl && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto h-8 shrink-0 rounded-lg border-gray-300 bg-white px-3 text-gray-950 shadow-none hover:bg-gray-50"
              asChild
            >
              <Link
                href={editUrl}
                aria-label={t("edit_encounter")}
                data-shortcut-id="update-encounter"
              >
                <SquarePen
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
                {t("edit")}
              </Link>
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}
