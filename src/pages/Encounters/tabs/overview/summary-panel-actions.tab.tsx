import { CheckIcon, NotebookPen } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { PLUGIN_Component } from "@/PluginEngine";

export const SummaryPanelActionsTab = () => {
  const { t } = useTranslation();

  const {
    actions: {
      markAsCompleted,
      assignLocation,
      manageDepartments,
      manageCareTeam,
      dispenseConsumable,
    },
    selectedEncounter,
  } = useEncounter();

  const actions = [
    {
      label: t("manage_consents"),
      onClick: () => navigate("consents"),
    },
    {
      label: t("manage_care_team"),
      onClick: manageCareTeam,
    },
    {
      label: t("update_location"),
      onClick: assignLocation,
    },
    {
      label: t("update_department"),
      onClick: manageDepartments,
    },
    {
      label: t("dispense_consumable"),
      onClick: dispenseConsumable,
    },
  ] as const satisfies { label: string; onClick: () => void }[];

  return (
    <div className="flex flex-col gap-2 bg-gray-100 @sm:bg-white p-2 @sm:p-3 rounded-lg border border-gray-200 @sm:shadow @sm:overflow-x-auto">
      <div className="flex pl-1 @xs:hidden">
        <h6 className="text-gray-950 font-semibold">{t("actions")}</h6>
      </div>
      <div className="flex flex-col sm:@sm:flex-row gap-3 sm:@sm:gap-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="justify-start sm:@sm:justify-center sm:@sm:flex-1"
            onClick={action.onClick}
          >
            <NotebookPen />
            {action.label}
          </Button>
        ))}

        {selectedEncounter && (
          <PLUGIN_Component
            __name="PatientInfoCardActions"
            encounter={selectedEncounter}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "justify-start sm:@sm:justify-center sm:@sm:flex-1",
            )}
          />
        )}

        <div className="sm:@sm:flex-1 flex flex-col gap-2 border-t border-gray-300 border-dashed sm:@sm:border-none pt-3 sm:@sm:pt-0">
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
