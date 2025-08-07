import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Reports } from "@/components/Facility/ConsultationDetails/OverviewSideBar";

export const SummaryPanel = () => {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="details">
      <TabsList className="w-full bg-gray-100 justify-between inset-shadow-sm py-px pl-0.5">
        <TabsTrigger value="details" className="w-full">
          {t("details")}
        </TabsTrigger>
        <TabsTrigger value="actions" className="w-full">
          {t("actions")}
        </TabsTrigger>
        <TabsTrigger value="reports" className="w-full">
          {t("reports")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        {/* <RenderDetailsTab encounter={encounter} canEdit={canEdit} /> */}
      </TabsContent>

      <TabsContent value="actions">
        {/* <Actions encounter={encounter} canWrite={canEdit} /> */}
      </TabsContent>

      <TabsContent value="reports">
        <Reports />
      </TabsContent>
    </Tabs>
  );
};
