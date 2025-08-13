import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { LocationSheet } from "@/components/Location/LocationSheet";
import { LocationTree } from "@/components/Location/LocationTree";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { EmptyState } from "./empty-state";

export const Locations = () => {
  const { t } = useTranslation();
  const { selectedEncounter: encounter } = useEncounter();

  if (!encounter) return null;

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200 pt-2 px-1 pb-1">
      <div className="flex justify-between items-center text-black pl-2 pb-1">
        <span className=" font-semibold">{t("location")}</span>
        <LocationSheet
          facilityId={encounter.facility.id}
          history={encounter.location_history}
          encounter={encounter}
          trigger={
            <div className="flex items-center gap-4 p-2">
              <CareIcon icon="l-history" className="text-gray-700" />
              <SquarePen className="size-4 cursor-pointer" strokeWidth={1.5} />
            </div>
          }
        />
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
