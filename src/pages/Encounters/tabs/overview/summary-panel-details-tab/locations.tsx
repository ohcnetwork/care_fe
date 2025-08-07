import { NotebookPen, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { LocationSheet } from "@/components/Location/LocationSheet";
import { LocationTree } from "@/components/Location/LocationTree";

import { EncounterRead } from "@/types/emr/encounter/encounter";

export const Locations = ({
  encounter,
  actionsTab = false,
  canEdit,
}: {
  encounter: EncounterRead;
  actionsTab?: boolean;
  canEdit?: boolean;
}) => {
  const { t } = useTranslation();

  if (actionsTab) {
    return (
      <div>
        <LocationSheet
          facilityId={encounter.facility.id}
          history={encounter.location_history}
          encounter={encounter}
          trigger={
            <>
              {canEdit ? (
                <Button variant="outline" className="w-full justify-start">
                  <NotebookPen className="size-4" />
                  {t("update_location")}
                </Button>
              ) : (
                <></>
              )}
            </>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center p-2">
        <span className="text-black font-semibold">{t("location")}</span>
        <LocationSheet
          facilityId={encounter.facility.id}
          history={encounter.location_history}
          encounter={encounter}
          trigger={
            <div className="flex items-center gap-2 p-2">
              <CareIcon icon="l-history" className="text-gray-700" />
              <SquarePen className="size-4 cursor-pointer" />
            </div>
          }
        />
      </div>
      <div className="bg-white rounded-md p-2 mx-1">
        {encounter.current_location ? (
          <LocationTree location={encounter.current_location} />
        ) : (
          <p className="text-gray-500 text-sm">{t("no_location_associated")}</p>
        )}
      </div>
    </div>
  );
};
