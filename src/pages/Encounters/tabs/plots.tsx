import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { FilterTabs } from "@/components/ui/filter-tabs";

import {
  ObservationPlotConfig,
  ObservationVisualizer,
} from "@/components/Common/Charts/ObservationChart";
import Loading from "@/components/Common/Loading";

import useBreakpoints from "@/hooks/useBreakpoints";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

type QueryParams = {
  plot: ObservationPlotConfig[number]["id"];
};

export const EncounterPlotsTab = () => {
  const { t } = useTranslation();
  const [qParams, setQParams] = useQueryParams<QueryParams>();

  const {
    patientId,
    selectedEncounterId: encounterId,
    canReadClinicalData: canAccess,
  } = useEncounter();

  const plotColumns = useBreakpoints({ default: 1, lg: 2 });

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
      <div className="overflow-x-scroll w-full">
        <FilterTabs
          value={currentTabId}
          onValueChange={(value) =>
            setQParams({ plot: value }, { overwrite: false })
          }
          options={data.map((tab) => ({
            value: tab.id,
            label: tab.name,
          }))}
          variant="underline"
          className="min-w-max"
          showAllOption={false}
          maxVisibleTabs={6}
        />
      </div>

      {data.map((tab) =>
        tab.id === currentTabId ? (
          <div key={tab.id}>
            <ObservationVisualizer
              patientId={patientId}
              encounterId={encounterId}
              codeGroups={tab.groups}
              gridCols={plotColumns}
              canAccess={canAccess}
            />
          </div>
        ) : null,
      )}
    </div>
  );
};
