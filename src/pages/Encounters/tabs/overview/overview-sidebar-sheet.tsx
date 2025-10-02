import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { FilterTabs } from "@/components/ui/filter-tabs";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

import { SummaryPanelActionsTab } from "./summary-panel-actions.tab";
import { Account } from "./summary-panel-details-tab/account";
import { AuditLogs } from "./summary-panel-details-tab/auditlogs";
import { DepartmentsAndTeams } from "./summary-panel-details-tab/department-and-team";
import { DischargeDetails } from "./summary-panel-details-tab/discharge-summary";
import { EncounterDetails } from "./summary-panel-details-tab/encounter-details";
import { EncounterTags } from "./summary-panel-details-tab/encounter-tags";
import { Forms } from "./summary-panel-details-tab/forms";
import { HospitalizationDetails } from "./summary-panel-details-tab/hospitalisation";
import { Locations } from "./summary-panel-details-tab/locations";
import { ManageCareTeam } from "./summary-panel-details-tab/manage-care-team";
import { SummaryPanelReportsTab } from "./summary-panel-reports-tab";

export const OverviewSidebarSheet = ({
  trigger,
}: {
  trigger: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const { canWriteSelectedEncounter: canEdit } = useEncounter();
  const [activeTab, setActiveTab] = useState("details");

  // Build tab options dynamically based on permissions
  const tabOptions = [
    { value: "details", label: "details" },
    ...(canEdit ? [{ value: "actions", label: "actions" }] : []),
    { value: "reports", label: "reports" },
  ];

  useEffect(() => {
    if (!canEdit && activeTab === "actions") {
      setActiveTab("details");
    }
  }, [canEdit, activeTab]);

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="overflow-y-auto min-w-full sm:min-w-128 p-5 sm:p-6"
      >
        <SheetHeader>
          <SheetTitle>
            <span className="text-xl font-semibold">
              {t("encounter_details")}
            </span>
          </SheetTitle>
          <Separator className="my-2" />
        </SheetHeader>

        <div className="p-2 rounded-lg">
          <FilterTabs
            value={activeTab}
            onValueChange={setActiveTab}
            options={tabOptions}
            variant="background"
            className="w-full bg-gray-100 justify-between mb-4"
            showAllOption={false}
            maxVisibleTabs={3}
          />

          {activeTab === "details" && (
            <div className="flex flex-col gap-4">
              <EncounterDetails />
              <EncounterTags />
              {canEdit && <Forms />}
              <Locations />
              <ManageCareTeam />
              <Account />
              <DepartmentsAndTeams />
              <HospitalizationDetails />
              <DischargeDetails />
              <AuditLogs />
            </div>
          )}

          {activeTab === "actions" && canEdit && <SummaryPanelActionsTab />}

          {activeTab === "reports" && <SummaryPanelReportsTab />}
        </div>
      </SheetContent>
    </Sheet>
  );
};
