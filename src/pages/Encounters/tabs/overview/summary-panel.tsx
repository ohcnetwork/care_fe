import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SummaryPanelActionsTab } from "@/pages/Encounters/tabs/overview/summary-panel-actions.tab";
import { SummaryPanelReportsTab } from "@/pages/Encounters/tabs/overview/summary-panel-reports-tab";

import { SummaryPanelDetailTab } from "./summary-panel-details-tab";

export const SummaryPanel = () => {
  const { t } = useTranslation();

  return (
    <div className="@container">
      <Tabs
        defaultValue="details"
        className="@xs:bg-gray-100 @xs:border border-gray-200 p-2 sm:p-0 @sm:p-1 @xs:rounded-lg"
      >
        <TabsList className="w-full sm:w-72 bg-gray-100 @xs:bg-gray-200 justify-between inset-shadow-sm pt-px pb-0.5 px-0.5">
          <TabsTrigger value="details" className="w-full">
            <span className="text-black">{t("details")}</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="w-full">
            <span className="text-black">{t("actions")}</span>
          </TabsTrigger>
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
