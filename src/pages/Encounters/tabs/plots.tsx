import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ObservationVisualizer } from "@/components/Common/Charts/ObservationChart";
import Loading from "@/components/Common/Loading";

import useBreakpoints from "@/hooks/useBreakpoints";
import { useScopedQueryParams } from "@/hooks/useScopedQueryParams";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { plotsConfigQueryOptions } from "@/pages/Encounters/utils/plotsConfigQuery";
import { ObservationPlotConfig } from "@/types/emr/observation/observation";

type QueryParams = {
  plot: ObservationPlotConfig[number]["id"];
};

export const EncounterPlotsTab = ({
  defaultPlot,
}: {
  /** Plot id from the plots configuration that opens first. */
  defaultPlot?: string;
} = {}) => {
  const { t } = useTranslation();
  const [qParams, setQParams] = useScopedQueryParams<QueryParams>();

  const { patientId, selectedEncounterId: encounterId } = useEncounter();

  const plotColumns = useBreakpoints({ default: 1, lg: 2 });

  const { data, isLoading } = useQuery(plotsConfigQueryOptions);

  if (isLoading || !data) {
    return <Loading />;
  }

  const requestedTabId = qParams.plot || defaultPlot;
  const currentTab =
    data.find((tab) => tab.id === requestedTabId) ?? data[0];

  if (!currentTab) {
    return <div>{t("no_plots_configured")}</div>;
  }

  return (
    <div className="mt-2">
      <Tabs
        value={currentTab.id}
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
