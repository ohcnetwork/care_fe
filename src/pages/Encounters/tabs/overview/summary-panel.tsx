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
        className="@xs:bg-muted-background @xs:border border-border p-1 xl:p-0 @xs:rounded-lg"
      >
        <TabsList className="w-full sm:w-72 bg-muted-background @xs:bg-strong-background justify-between inset-shadow-sm pt-px pb-0.5 px-0.5">
          <TabsTrigger value="details" className="w-full">
            <span className="text-foreground">{t("details")}</span>
          </TabsTrigger>
          {canWriteSelectedEncounter && (
            <TabsTrigger value="actions" className="w-full">
              <span className="text-foreground">{t("actions")}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="reports" className="w-full">
            <span className="text-foreground">{t("reports")}</span>
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
