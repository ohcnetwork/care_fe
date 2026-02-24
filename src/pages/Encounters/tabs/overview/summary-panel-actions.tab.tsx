import { CheckIcon, NotebookPen } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { PLUGIN_Component } from "@/PluginEngine";
import { Account } from "./summary-panel-details-tab/account";
import { DepartmentsAndTeams } from "./summary-panel-details-tab/department-and-team";
import { DischargeDetails } from "./summary-panel-details-tab/discharge-summary";
import { EncounterTags } from "./summary-panel-details-tab/encounter-tags";
import { HospitalizationDetails } from "./summary-panel-details-tab/hospitalisation";
import { Locations } from "./summary-panel-details-tab/locations";
import { ManageCareTeam } from "./summary-panel-details-tab/manage-care-team";

export const SummaryPanelActionsTab = () => {
  const { t } = useTranslation();

  const {
    actions: {
      markAsCompleted,
      assignLocation,
      manageDepartments,
      manageCareTeam,
      dispense,
    },
    selectedEncounter,
  } = useEncounter();

  const actions = [
    {
      label: t("manage_consents"),
      onClick: () => navigate("consents"),
      hideOnMobile: false,
    },
    {
      label: t("manage_care_team"),
      onClick: manageCareTeam,
      hideOnMobile: true,
    },
    {
      label: t("update_location"),
      onClick: assignLocation,
      hideOnMobile: true,
    },
    {
      label: t("update_department"),
      onClick: manageDepartments,
      hideOnMobile: true,
    },
    {
      label: t("dispense"),
      onClick: dispense,
      hideOnMobile: false,
    },
  ] as const satisfies {
    label: string;
    onClick: () => void;
    hideOnMobile: boolean;
  }[];

  return (
    <div className="flex flex-col gap-2 bg-gray-100 @sm:bg-white p-2 @sm:p-3 rounded-lg border border-gray-200 @sm:shadow @sm:overflow-x-auto">
      <div className="flex pl-1 @xs:hidden">
        <h6 className="text-gray-950 font-semibold">{t("actions")}</h6>
      </div>
      <div>
        <div className="flex flex-col sm:@sm:flex-row gap-3 sm:@sm:gap-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className={cn(
                "justify-start sm:@sm:justify-center sm:@sm:flex-1",
                action.hideOnMobile && "hidden xl:flex",
              )}
              onClick={action.onClick}
            >
              <NotebookPen />
              {action.label}
            </Button>
          ))}

          {selectedEncounter && (
            <PLUGIN_Component
              __name="EncounterActions"
              encounter={selectedEncounter}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "justify-start sm:@sm:justify-center sm:@sm:flex-1 w-full",
              )}
            />
          )}
        </div>
        <div className="flex xl:hidden flex-col space-y-2 mt-3">
          <Account />
          <EncounterTags />
          <Locations />
          <ManageCareTeam />
          <DepartmentsAndTeams />
          <HospitalizationDetails />
          <DischargeDetails />
        </div>
        <div className="sm:@sm:flex-1 flex flex-col gap-2 border-t border-gray-300 border-dashed sm:@sm:border-none pt-3 sm:@sm:pt-0 mt-3">
          <Button
            variant="outline_primary"
            className="justify-start sm:@sm:justify-center"
            onClick={markAsCompleted}
          >
            <CheckIcon />
            {t("mark_as_completed")}
          </Button>
        </div>
      </div>
    </div>
  );
};
