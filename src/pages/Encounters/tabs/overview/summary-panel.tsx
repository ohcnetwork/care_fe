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
        <TabsList className="w-full sm:w-72">
          <TabsTrigger value="details">{t("details")}</TabsTrigger>
          {canWriteSelectedEncounter && (
            <TabsTrigger value="actions">{t("actions")}</TabsTrigger>
          )}
          <TabsTrigger value="reports">{t("reports")}</TabsTrigger>
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
