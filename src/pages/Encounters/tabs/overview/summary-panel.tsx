import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SummaryPanelActionsTab } from "@/pages/Encounters/tabs/overview/summary-panel-actions.tab";
import { SummaryPanelReportsTab } from "@/pages/Encounters/tabs/overview/summary-panel-reports-tab";

export const SummaryPanel = () => {
  const { t } = useTranslation();

  return (
    <div className="@container">
      <Tabs
        defaultValue="details"
        className="@sm:bg-gray-100 @sm:border border-gray-200 @sm:p-1 @sm:rounded-lg"
      >
        <TabsList className="w-72 bg-gray-100 @sm:bg-gray-200 justify-between inset-shadow-sm pt-px pb-0.5 px-0.5">
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
          {/* <RenderDetailsTab encounter={encounter} canEdit={canEdit} /> */}
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
