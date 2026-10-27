import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";
import { VitalsList } from "@/components/Patient/vitals/list";

import query from "@/Utils/request/query";
import { formatDateTime, formatName, relativeTime } from "@/Utils/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import type { Code } from "@/types/base/code/code";
import {
  ObservationAnalyzeGroup,
  ObservationListRead,
  ObservationPlotConfig,
} from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import { vitalsConfigSchema } from "@/types/workspace/widgetConfigSchemas";

interface EncounterVitalsWidgetProps {
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

export function EncounterVitalsWidget({
  title,
  showEmpty = false,
  config = {},
}: EncounterVitalsWidgetProps) {
  const { t } = useTranslation();
  const { patientId, selectedEncounterId, canReadClinicalData } =
    useEncounter();
  const parsedConfig = vitalsConfigSchema.safeParse(config);
  const codes = parsedConfig.data?.codes;
  const { data, isLoading, isError, isFetching, refetch } =
    useQuery<ObservationPlotConfig>({
      queryKey: ["plots-config"],
      queryFn: async ({ signal }) => {
        const response = await fetch(careConfig.plotsConfigUrl, { signal });
        if (!response.ok)
          throw new Error("Unable to load vital signs configuration");
        return response.json();
      },
      enabled: canReadClinicalData && parsedConfig.success && !codes,
    });

  if (!canReadClinicalData) return null;
  const heading = title ?? t("vitals");
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
  if (codes) {
    return (
      <LatestVitals
        patientId={patientId}
        encounterId={selectedEncounterId}
        codes={codes}
        title={heading}
        showEmpty={showEmpty}
      />
    );
  }
  if (isLoading || isError) {
    return (
      <section aria-label={heading} className="min-w-0">
        <EncounterAccordionLayout title={heading} readOnly presentation="panel">
          {isError ? (
            <ClinicalListError isFetching={isFetching} onRetry={refetch} />
          ) : (
            <div role="status" aria-label={t("loading")}>
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </EncounterAccordionLayout>
      </section>
    );
  }

  return (
    <VitalsList
      patientId={patientId}
      encounterId={selectedEncounterId}
      codeGroups={
        data?.find((plot) => plot.id === "primary-parameters")?.groups ?? []
      }
      title={title}
      showEmpty={showEmpty}
      presentation="panel"
    />
  );
}

// The analysis endpoint returns the newest readings per code, so one request
// resolves every tile regardless of how often other vitals were charted. A
// few extra rows absorb the difference between entry order and effective time.
const READINGS_PER_CODE = 3;

interface VitalReading {
  code: Code;
  latest?: ObservationListRead;
  previous?: ObservationListRead;
}

function observationTime(observation: ObservationListRead) {
  return Date.parse(observation.effective_datetime);
}

function latestVitalReadings(
  groups: ObservationAnalyzeGroup[],
  codes: Code[],
): VitalReading[] {
  return codes.map((code) => {
    const matches = [
      ...(groups.find(
        (group) =>
          group.code.code === code.code && group.code.system === code.system,
      )?.results ?? []),
    ].sort((a, b) => observationTime(b) - observationTime(a));
    return { code, latest: matches[0], previous: matches[1] };
  });
}

function readingValue(observation: ObservationListRead) {
  const raw = observation.value.value;
  if (raw !== null && raw !== undefined && raw !== "") {
    const numeric = Number(raw);
    return {
      text: String(raw),
      numeric: Number.isFinite(numeric) ? numeric : undefined,
      unit: observation.value.unit?.code,
    };
  }
  const components =
    observation.component
      ?.map((component) => component.value.value)
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map(String) ?? [];
  return {
    text: components.join("/"),
    numeric: undefined,
    unit: observation.component?.[0]?.value.unit?.code,
  };
}

function LatestVitals({
  patientId,
  encounterId,
  codes,
  title,
  showEmpty,
}: {
  patientId: string;
  encounterId: string;
  codes: Code[];
  title: string;
  showEmpty: boolean;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [
      "observations",
      patientId,
      encounterId,
      "latest",
      codes.map((code) => `${code.system}|${code.code}`),
    ],
    queryFn: query(observationApi.analyse, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId },
      body: { codes, page_size: READINGS_PER_CODE },
      silent: true,
    }),
  });
  const readings = useMemo(
    () => latestVitalReadings(data?.results ?? [], codes),
    [codes, data?.results],
  );
  const newest = readings
    .flatMap((reading) => (reading.latest ? [reading.latest] : []))
    .sort((a, b) => observationTime(b) - observationTime(a))[0];

  if (!isLoading && !isError && !newest && !showEmpty) return null;

  return (
    <section aria-label={title} className="min-w-0">
      <EncounterAccordionLayout title={title} readOnly presentation="panel">
        {isLoading ? (
          <div role="status" aria-label={t("loading")}>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <ClinicalListError isFetching={isFetching} onRetry={refetch} />
        ) : !newest ? (
          <p className="p-2 text-sm text-soft-foreground">
            {t("no_vitals_recorded")}
          </p>
        ) : (
          <div className="@container space-y-3">
            <p className="text-xs text-soft-foreground">
              <Trans
                i18nKey="workspace_vitals_last_recorded"
                values={{
                  time: relativeTime(newest.effective_datetime),
                  name: formatName(newest.data_entered_by ?? newest.created_by),
                }}
                components={{
                  time: (
                    <time
                      dateTime={newest.effective_datetime}
                      title={formatDateTime(newest.effective_datetime)}
                      className="font-medium text-muted-foreground"
                    />
                  ),
                }}
              />
            </p>
            <ul className="grid grid-cols-2 gap-2 @md:grid-cols-3 @2xl:grid-cols-4">
              {readings.map((reading) => (
                <VitalTile
                  key={`${reading.code.system}|${reading.code.code}`}
                  reading={reading}
                  newestTime={newest.effective_datetime}
                />
              ))}
            </ul>
          </div>
        )}
      </EncounterAccordionLayout>
    </section>
  );
}

function VitalTile({
  reading,
  newestTime,
}: {
  reading: VitalReading;
  newestTime: string;
}) {
  const { t } = useTranslation();
  const { code, latest, previous } = reading;
  const value = latest ? readingValue(latest) : undefined;
  const previousValue = previous ? readingValue(previous) : undefined;
  // Readings may carry their own units (37 Cel vs 98.6 [degF]); only compare
  // like with like.
  const delta =
    value?.numeric !== undefined &&
    previousValue?.numeric !== undefined &&
    value.unit === previousValue.unit
      ? Math.round((value.numeric - previousValue.numeric) * 10) / 10
      : undefined;
  const DeltaIcon =
    delta === undefined
      ? null
      : delta > 0
        ? ArrowUp
        : delta < 0
          ? ArrowDown
          : Minus;
  const isOlder =
    latest &&
    Date.parse(latest.effective_datetime) < Date.parse(newestTime) - 60_000;

  return (
    <li
      aria-label={code.display}
      className="min-w-0 rounded-lg border border-soft-border bg-soft-background p-2.5"
    >
      <p className="truncate text-xs text-soft-foreground" title={code.display}>
        {code.display}
      </p>
      {value ? (
        <p className="mt-1 text-lg leading-6 font-semibold break-words text-foreground">
          {value.text}
          {value.unit && (
            <span className="ml-1 text-xs font-normal text-soft-foreground">
              {value.unit}
            </span>
          )}
        </p>
      ) : (
        <p className="mt-1 text-sm leading-6 text-placeholder-foreground">
          {t("workspace_vitals_no_reading")}
        </p>
      )}
      {delta !== undefined && DeltaIcon && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-soft-foreground">
          <DeltaIcon className="size-3" aria-hidden="true" />
          {delta === 0
            ? t("workspace_vitals_no_change")
            : `${delta > 0 ? "+" : ""}${delta}`}
          <span className="sr-only">
            {t("workspace_vitals_change_from_previous")}
          </span>
        </p>
      )}
      {latest && isOlder && (
        <time
          dateTime={latest.effective_datetime}
          title={formatDateTime(latest.effective_datetime)}
          className="mt-0.5 block text-[11px] text-placeholder-foreground"
        >
          {relativeTime(latest.effective_datetime)}
        </time>
      )}
    </li>
  );
}
