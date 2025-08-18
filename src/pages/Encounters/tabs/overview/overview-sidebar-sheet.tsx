import { useTranslation } from "react-i18next";

import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <Tabs defaultValue="details" className="p-2 rounded-lg">
          <TabsList className="w-full bg-gray-100 justify-between inset-shadow-sm pt-px pb-0.5 px-0.5">
            <TabsTrigger value="details" className="w-full">
              <span className="text-black">{t("details")}</span>
            </TabsTrigger>
            {canEdit && (
              <TabsTrigger value="actions" className="w-full">
                <span className="text-black">{t("actions")}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="reports" className="w-full">
              <span className="text-black">{t("reports")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
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
          </TabsContent>

          <TabsContent value="actions">
            <SummaryPanelActionsTab />
          </TabsContent>

          <TabsContent value="reports">
            <SummaryPanelReportsTab />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
