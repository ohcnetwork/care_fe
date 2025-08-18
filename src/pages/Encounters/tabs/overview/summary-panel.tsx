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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="@xs:bg-gray-100 @xs:border border-gray-200 p-1 xl:p-0 @xs:rounded-lg"
      >
        <TabsList className="w-full sm:w-72 bg-gray-100 @xs:bg-gray-200 justify-between inset-shadow-sm pt-px pb-0.5 px-0.5">
          <TabsTrigger value="details" className="w-full">
            <span className="text-black">{t("details")}</span>
          </TabsTrigger>
          {canWriteSelectedEncounter && (
            <TabsTrigger value="actions" className="w-full">
              <span className="text-black">{t("actions")}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="reports" className="w-full">
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
          <SummaryPanelReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
