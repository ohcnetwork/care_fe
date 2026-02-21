import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ObservationVisualizer } from "@/components/Common/Charts/ObservationChart";
import Loading from "@/components/Common/Loading";

import useBreakpoints from "@/hooks/useBreakpoints";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { ObservationPlotConfig } from "@/types/emr/observation/observation";

type QueryParams = {
  plot: ObservationPlotConfig[number]["id"];
};

const fetchOptions = { cache: "no-store" as RequestCache };

export const EncounterPlotsTab = () => {
  const { t } = useTranslation();
  const [qParams, setQParams] = useQueryParams<QueryParams>();

  const { patientId, selectedEncounterId: encounterId } = useEncounter();

  const plotColumns = useBreakpoints({ default: 1, lg: 2 });

  const { data, isLoading } = useQuery<ObservationPlotConfig>({
    queryKey: ["plots-config"],
    queryFn: () =>
      fetch(careConfig.plotsConfigUrl, fetchOptions).then((res) => res.json()),
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
        onValueChange={(value) =>
          setQParams({ plot: value }, { overwrite: false })
        }
      >
        <div className="overflow-x-scroll w-full">
          <TabsList>
            {data.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {data.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <ObservationVisualizer
              patientId={patientId}
              encounterId={encounterId}
              codeGroups={tab.groups}
              gridCols={plotColumns}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
