import { HistoryIcon, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { LocationTree } from "@/components/Location/LocationTree";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EmptyState } from "./empty-state";

export const Locations = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter,
    actions: { assignLocation, viewLocationHistory },
  } = useEncounter();

  if (!encounter) return <CardListSkeleton count={1} />;

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 p-1 pt-2 space-y-1">
      <div className="flex justify-between items-center text-black pl-2">
        <span className=" font-semibold">{t("location")}</span>
        <div className="flex">
          <Button variant="ghost" size="sm" onClick={viewLocationHistory}>
            <HistoryIcon className="cursor-pointer" strokeWidth={1.5} />
          </Button>
          {canWriteSelectedEncounter && (
            <Button variant="ghost" size="sm" onClick={assignLocation}>
              <SquarePen className="cursor-pointer" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-md p-2 shadow">
        {encounter.current_location ? (
          <LocationTree location={encounter.current_location} />
        ) : (
          <EmptyState message={t("no_location_associated")} />
        )}
      </div>
    </div>
  );
};
