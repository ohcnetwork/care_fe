import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SummaryPanelActionsTab } from "@/pages/Encounters/tabs/overview/summary-panel-actions.tab";
import { SummaryPanelReportsTab } from "@/pages/Encounters/tabs/overview/summary-panel-reports-tab";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { SummaryPanelDetailTab } from "./summary-panel-details-tab";

export const SummaryPanel = () => {
  const { t } = useTranslation();
  const { canWriteSelectedEncounter } = useEncounter();
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (!canWriteSelectedEncounter) {
      setActiveTab("details");
    }
  }, [canWriteSelectedEncounter]);

  return (
    <div className="@container">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-2">
        <TabsList className="h-10 w-full sm:w-72 justify-between rounded-xl border border-gray-200 bg-white p-1">
          <TabsTrigger
            value="details"
            className="w-full rounded-lg data-[state=active]:border-gray-200 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
          >
            <span className="text-black">{t("details")}</span>
          </TabsTrigger>
          {canWriteSelectedEncounter && (
            <TabsTrigger
              value="actions"
              className="w-full rounded-lg data-[state=active]:border-gray-200 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
            >
              <span className="text-black">{t("actions")}</span>
            </TabsTrigger>
          )}
          <TabsTrigger
            value="reports"
            className="w-full rounded-lg data-[state=active]:border-gray-200 data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
          >
            <span className="text-black">{t("reports")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <SummaryPanelDetailTab />
        </TabsContent>

        <TabsContent value="actions">
          <SummaryPanelActionsTab />
        </TabsContent>

        <TabsContent value="reports">
          <SummaryPanelReportsTab activeTab={activeTab} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
