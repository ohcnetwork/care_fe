import { HistoryIcon, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { LocationTree } from "@/components/Location/LocationTree";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { SummaryPanelEmptyState as EmptyState } from "./empty-state";

export const Locations = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter,
    actions: { assignLocation, viewLocationHistory },
  } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white">
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-gray-200 px-3 py-1">
        <span className="text-sm font-bold uppercase tracking-wide text-gray-600">
          {t("location")}
        </span>
        <div className="flex">
          <Button variant="ghost" size="sm" onClick={viewLocationHistory}>
            <HistoryIcon className="cursor-pointer" strokeWidth={1.5} />
          </Button>
          {canWriteSelectedEncounter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={assignLocation}
              data-shortcut-id="assign-location"
            >
              <SquarePen className="cursor-pointer" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
      <div className="p-3">
        {encounter.current_location ? (
          <LocationTree location={encounter.current_location} />
        ) : (
          <EmptyState message={t("no_location_associated")} />
        )}
      </div>
    </div>
  );
};
