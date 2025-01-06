import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ObservationPlotConfig,
  ObservationVisualizer,
} from "@/components/Common/Charts/ObservationChart";
import Loading from "@/components/Common/Loading";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

type QueryParams = {
  plot: ObservationPlotConfig[number]["id"];
};

export const EncounterPlotsTab = (props: EncounterTabProps) => {
  const { t } = useTranslation();
  const [qParams, setQParams] = useQueryParams<QueryParams>();

  const { data, isLoading } = useQuery<ObservationPlotConfig>({
    queryKey: ["plots-config"],
    queryFn: () => fetch(careConfig.plotsConfigUrl).then((res) => res.json()),
  });

  if (isLoading || !data) {
    return <Loading />;
  }

  const currentTabId = qParams.plot || data[0].id;
  const currentTab = data.find((tab) => tab.id === currentTabId);

  if (!currentTab) {
    return <div>{t("no_plots_configured")}</div>;
  }

  return (
    <div className="mt-2">
      <Tabs
        value={currentTabId}
        onValueChange={(value) => setQParams({ plot: value })}
      >
        <TabsList>
          {data.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {data.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <ObservationVisualizer
              patientId={props.patient.id}
              encounterId={props.encounter.id}
              codeGroups={tab.groups}
              gridCols={2}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
