import { HistoryIcon, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { LocationTree } from "@/components/Location/LocationTree";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { SummaryPanelEmptyState as EmptyState } from "./empty-state";

interface LocationsProps {
  title?: string;
}

export const Locations = ({ title }: LocationsProps = {}) => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter,
    actions: { assignLocation, viewLocationHistory },
  } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <section
      aria-label={title ?? t("location")}
      className="min-w-0 w-full rounded-xl border border-gray-200 bg-white"
    >
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
        <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-bold uppercase tracking-wide text-gray-600">
          {title ?? t("location")}
        </span>
        <div className="flex shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={viewLocationHistory}
            aria-label={t("view_history")}
          >
            <HistoryIcon className="cursor-pointer" strokeWidth={1.5} />
          </Button>
          {canWriteSelectedEncounter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={assignLocation}
              data-shortcut-id="assign-location"
              aria-label={t("update_location")}
            >
              <SquarePen className="cursor-pointer" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
      <div className="min-w-0 overflow-x-auto p-3 [overflow-wrap:anywhere] [&_[data-slot=badge]]:whitespace-normal">
        {encounter.current_location ? (
          <LocationTree location={encounter.current_location} />
        ) : (
          <EmptyState message={t("no_location_associated")} />
        )}
      </div>
    </section>
  );
};
