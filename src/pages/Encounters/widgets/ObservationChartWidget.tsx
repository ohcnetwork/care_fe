import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { ObservationVisualizer } from "@/components/Common/Charts/ObservationChart";
import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { ObservationPlotConfig } from "@/types/emr/observation/observation";
import { observationChartConfigSchema } from "@/types/workspace/widgetConfigSchemas";

interface ObservationChartWidgetProps {
  title?: string;
  config?: Record<string, unknown>;
}

/** One or more chart groups from the plots configuration, without the plot tabs. */
export function ObservationChartWidget({
  title,
  config = {},
}: ObservationChartWidgetProps) {
  const { t } = useTranslation();
  const { patientId, selectedEncounterId, canReadClinicalData } =
    useEncounter();
  const parsedConfig = observationChartConfigSchema.safeParse(config);
  const {
    plot: plotId,
    groups: groupTitles,
    height,
    columns,
  } = parsedConfig.data ?? {};
  const { data, isLoading, isError, isFetching, refetch } =
    useQuery<ObservationPlotConfig>({
      queryKey: ["plots-config"],
      queryFn: async ({ signal }) => {
        const response = await fetch(careConfig.plotsConfigUrl, { signal });
        if (!response.ok)
          throw new Error("Unable to load vital signs configuration");
        return response.json();
      },
      enabled: canReadClinicalData && parsedConfig.success,
    });

  if (!canReadClinicalData) return null;
  const heading = title ?? t("workspace_observation_chart");
  if (!parsedConfig.success) {
    return (
      <section aria-label={heading}>
        <Alert variant="destructive">
          <AlertDescription>
            {t("encounter_widget_config_invalid")}
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const plot = plotId
    ? data?.find((candidate) => candidate.id === plotId)
    : data?.[0];
  const wantedGroups = groupTitles ? new Set(groupTitles) : undefined;
  const groups = (plot?.groups ?? []).filter(
    (group) => !wantedGroups || wantedGroups.has(group.title),
  );

  return (
    <section aria-label={heading} className="min-w-0">
      <EncounterAccordionLayout title={heading} readOnly presentation="panel">
        {isLoading ? (
          <div role="status" aria-label={t("loading")}>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : isError ? (
          <ClinicalListError isFetching={isFetching} onRetry={refetch} />
        ) : !groups.length ? (
          <p className="p-2 text-sm text-soft-foreground">
            {t("workspace_observation_chart_no_groups")}
          </p>
        ) : (
          <div className="@container">
            <ObservationVisualizer
              patientId={patientId}
              encounterId={selectedEncounterId}
              codeGroups={groups}
              height={height}
              gridCols={columns ?? 1}
            />
          </div>
        )}
      </EncounterAccordionLayout>
    </section>
  );
}
