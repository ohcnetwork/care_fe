import { CheckIcon, NotebookPen } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { encounterRequiresDischarge } from "@/pages/Encounters/utils/useEncounterProgressController";
import { PLUGIN_Component } from "@/PluginEngine";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import { Account } from "./summary-panel-details-tab/account";
import { DepartmentsAndTeams } from "./summary-panel-details-tab/department-and-team";
import { DischargeDetails } from "./summary-panel-details-tab/discharge-summary";
import { EncounterTags } from "./summary-panel-details-tab/encounter-tags";
import { HospitalizationDetails } from "./summary-panel-details-tab/hospitalisation";
import { Locations } from "./summary-panel-details-tab/locations";
import { ManageCareTeam } from "./summary-panel-details-tab/manage-care-team";

interface SummaryPanelActionsTabProps {
  title?: string;
  embedded?: boolean;
}

export const SummaryPanelActionsTab = ({
  title,
  embedded = false,
}: SummaryPanelActionsTabProps = {}) => {
  const { t } = useTranslation();

  const {
    actions: {
      assignLocation,
      manageDepartments,
      manageCareTeam,
      dispense,
      markAsCompleted,
    },
    selectedEncounter,
  } = useEncounter();

  const actions = [
    ...(!embedded
      ? [
          {
            label: t("manage_consents"),
            onClick: () => navigate("consents"),
            hideOnMobile: false,
          },
        ]
      : []),
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
      label: t("refer_patient"),
      onClick: () => {
        navigate(
          `/facility/${selectedEncounter?.facility.id}/resource/new?related_patient=${selectedEncounter?.patient.id}`,
        );
      },
      hideOnMobile: false,
    },
    {
      label: t("dispense"),
      onClick: dispense,
      hideOnMobile: false,
      shortcut: <ShortcutBadge actionId="dispense" />,
    },
  ] as const satisfies {
    label: string;
    onClick: () => void;
    hideOnMobile: boolean;
    shortcut?: React.ReactNode;
  }[];

  return (
    <section
      aria-label={title ?? t("actions")}
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3"
    >
      <div
        className={cn(
          "-mx-3 -mt-3 flex border-b border-gray-200 px-3 py-3",
          !embedded && "@xs:hidden",
        )}
      >
        <h3 className="min-w-0 text-sm font-bold uppercase tracking-wide text-gray-600 [overflow-wrap:anywhere]">
          {title ?? t("actions")}
        </h3>
      </div>
      <div>
        <div
          className={cn(
            "flex min-w-0 flex-col gap-3",
            !embedded && "sm:@sm:flex-row sm:@sm:gap-4",
          )}
        >
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className={cn(
                "h-auto min-h-9 justify-start whitespace-normal [overflow-wrap:anywhere]",
                !embedded && "sm:@sm:justify-center sm:@sm:flex-1",
                !embedded && action.hideOnMobile && "hidden xl:flex",
              )}
              onClick={action.onClick}
            >
              <NotebookPen />
              {action.label}
              <span className="ml-auto">
                {"shortcut" in action && action.shortcut}
              </span>
            </Button>
          ))}

          {selectedEncounter && (
            <PLUGIN_Component
              __name="EncounterActions"
              encounter={selectedEncounter}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto min-h-9 justify-start whitespace-normal w-full",
                !embedded && "sm:@sm:justify-center sm:@sm:flex-1",
              )}
            />
          )}
        </div>
        {!embedded && (
          <div className="flex xl:hidden flex-col space-y-2 mt-3">
            <Account />
            <EncounterTags />
            <Locations />
            <ManageCareTeam />
            <DepartmentsAndTeams />
            <HospitalizationDetails />
            <DischargeDetails />
          </div>
        )}
        {selectedEncounter && (
          <div
            className={cn(
              "flex flex-col gap-2 border-t border-gray-300 border-dashed pt-3 mt-3",
              !embedded && "sm:@sm:flex-1 sm:@sm:border-none sm:@sm:pt-0",
            )}
          >
            <Button
              variant="outline_primary"
              className={cn(
                "h-auto min-h-9 justify-start whitespace-normal",
                !embedded && "sm:@sm:justify-center",
              )}
              onClick={() => markAsCompleted()}
            >
              <CheckIcon />
              {encounterRequiresDischarge(selectedEncounter)
                ? t("mark_for_discharge")
                : t("mark_as_completed")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
