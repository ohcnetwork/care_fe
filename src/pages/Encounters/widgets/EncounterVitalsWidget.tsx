import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import type { TFunction } from "i18next";
import {
  ArrowDownRight,
  ArrowUpRight,
  History,
  TriangleAlert,
} from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import { ObservationDetailSheet } from "@/components/Common/Charts/ObservationDetailSheet";
import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { EncounterAccordionLayout } from "@/components/Patient/EncounterAccordionLayout";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import type { Code } from "@/types/base/code/code";
import {
  ObservationAnalyzeGroup,
  ObservationListRead,
  ObservationPlotConfig,
  ObservationReferenceRange,
  ObservationStatus,
  QuestionnaireSubmitResultValue,
} from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import { vitalsConfigSchema } from "@/types/workspace/widgetConfigSchemas";

interface EncounterVitalsWidgetProps {
  patientId: string;
  /** Omit on history pages to show the patient's latest readings. */
  encounterId?: string;
  canRead: boolean;
  title?: string;
  showEmpty?: boolean;
  config?: Record<string, unknown>;
}

export function EncounterVitalsWidget({
  patientId,
  encounterId,
  canRead: canReadClinicalData,
  title,
  showEmpty = false,
  config = {},
}: EncounterVitalsWidgetProps) {
  const { t } = useTranslation();
  const parsedConfig = vitalsConfigSchema.safeParse(config);
  const configuredCodes = parsedConfig.data?.codes;
  const defaults = useDefaultVitalCodes(
    canReadClinicalData && parsedConfig.success && !configuredCodes,
  );

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
  if (!configuredCodes && (defaults.isLoading || defaults.isError)) {
    return (
      <VitalsPanel title={heading}>
        {defaults.isError ? (
          <ClinicalListError
            isFetching={defaults.isFetching}
            onRetry={defaults.refetch}
          />
        ) : (
          <div role="status" aria-label={t("loading")}>
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </VitalsPanel>
    );
  }

  return (
    <VitalsMatrix
      patientId={patientId}
      encounterId={encounterId}
      codes={configuredCodes ?? defaults.data ?? []}
      title={heading}
      showEmpty={showEmpty}
    />
  );
}

// The analysis endpoint returns the most recently modified readings per code,
// so one request fills the matrix regardless of how often other vitals were
// charted. It cannot exclude entered-in-error rows, and marking one bumps it to
// the top, so extra rows leave room for corrections and back-dated entries.
const READINGS_PER_CODE = 8;
const VISIBLE_READINGS = 4;
// FiO2 is charted with the primary parameters but is a setting, not a vital.
const EXCLUDED_DEFAULT_CODES = new Set(["3151-8"]);

type ReadingFlag = "high" | "low" | "abnormal";

interface VitalCell {
  observation: ObservationListRead;
  text: string;
  unit?: string;
  flag?: ReadingFlag;
  interpretation?: string;
}

interface VitalRow {
  code: Code;
  unit?: string;
  range?: string;
  cells: Map<number, VitalCell>;
}

interface VitalColumn {
  key: number;
  time: string;
}

function codeKey(code: Code) {
  return `${code.system}|${code.code}`;
}

function minuteKey(observation: ObservationListRead) {
  return Math.floor(Date.parse(observation.effective_datetime) / 60_000);
}

function codingText(value: QuestionnaireSubmitResultValue) {
  return value.coding?.display || value.coding?.code || undefined;
}

function readingValue(observation: ObservationListRead) {
  const raw = observation.value.value;
  if (raw !== null && raw !== undefined && raw !== "") {
    return { text: String(raw), unit: observation.value.unit?.code };
  }
  const coded = codingText(observation.value);
  if (coded) return { text: coded, unit: undefined };
  const components =
    observation.component
      ?.map((component) => component.value.value || codingText(component.value))
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map(String) ?? [];
  return {
    text: components.join("/"),
    unit: observation.component?.[0]?.value.unit?.code,
  };
}

// FHIR ObservationInterpretation codes encode direction (H, HH, HU / L, LL,
// LU); anything else that the backend highlighted is abnormal without one.
function readingFlag(observation: ObservationListRead) {
  const interpretation = [
    observation.interpretation,
    ...(observation.component?.map((component) => component.interpretation) ??
      []),
  ].find((item) => item?.highlight);
  if (!interpretation) return undefined;
  const code = interpretation.code?.code?.toUpperCase() ?? "";
  const flag: ReadingFlag = code.startsWith("H")
    ? "high"
    : code.startsWith("L")
      ? "low"
      : "abnormal";
  return { flag, interpretation: interpretation.display };
}

function normalRangeText(ranges?: ObservationReferenceRange[]) {
  const range = ranges?.find(
    (item) =>
      !item.interpretation?.highlight &&
      (item.min !== undefined || item.max !== undefined),
  );
  if (!range) return undefined;
  if (range.min !== undefined && range.max !== undefined)
    return `${range.min}–${range.max}`;
  return range.max !== undefined ? `<${range.max}` : `>${range.min}`;
}

function rangeText(observation: ObservationListRead) {
  if (observation.component?.length) {
    const parts = observation.component.map((component) =>
      normalRangeText(component.reference_range),
    );
    return parts.some(Boolean)
      ? parts.map((part) => part ?? "–").join(" / ")
      : undefined;
  }
  return normalRangeText(observation.reference_range);
}

function buildMatrix(groups: ObservationAnalyzeGroup[], codes: Code[]) {
  const columns = new Map<number, VitalColumn>();
  const rows: VitalRow[] = codes.map((code) => {
    const readings = (
      groups.find(
        (group) =>
          group.code.code === code.code && group.code.system === code.system,
      )?.results ?? []
    )
      .filter(
        (observation) =>
          observation.status !== ObservationStatus.ENTERED_IN_ERROR,
      )
      .sort(
        (a, b) =>
          Date.parse(b.effective_datetime) - Date.parse(a.effective_datetime),
      );
    const cells = new Map<number, VitalCell>();
    for (const observation of readings) {
      const key = minuteKey(observation);
      if (cells.has(key)) continue;
      cells.set(key, {
        observation,
        ...readingValue(observation),
        ...readingFlag(observation),
      });
      if (!columns.has(key))
        columns.set(key, { key, time: observation.effective_datetime });
    }
    const latest = readings[0];
    return {
      code,
      unit: latest ? readingValue(latest).unit : undefined,
      range: latest ? rangeText(latest) : undefined,
      cells,
    };
  });
  const sortedColumns = [...columns.values()].sort((a, b) => b.key - a.key);
  return { rows, columns: sortedColumns };
}

function useDefaultVitalCodes(enabled: boolean) {
  return useQuery<ObservationPlotConfig, Error, Code[]>({
    queryKey: ["plots-config"],
    queryFn: async ({ signal }) => {
      const response = await fetch(careConfig.plotsConfigUrl, { signal });
      if (!response.ok)
        throw new Error("Unable to load vital signs configuration");
      return response.json();
    },
    select: (plots) => {
      const seen = new Set<string>();
      return (
        plots.find((plot) => plot.id === "primary-parameters")?.groups ?? []
      )
        .flatMap((group) => group.codes)
        .filter((code) => {
          const key = codeKey(code);
          if (
            !code.display ||
            EXCLUDED_DEFAULT_CODES.has(code.code) ||
            seen.has(key)
          )
            return false;
          seen.add(key);
          return true;
        });
    },
    enabled,
  });
}

function VitalsPanel({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="min-w-0">
      <EncounterAccordionLayout
        title={title}
        readOnly
        presentation="panel"
        actionButton={actions}
      >
        {children}
      </EncounterAccordionLayout>
    </section>
  );
}

function VitalsMatrix({
  patientId,
  encounterId,
  codes,
  title,
  showEmpty,
}: {
  patientId: string;
  encounterId?: string;
  codes: Code[];
  title: string;
  showEmpty: boolean;
}) {
  const { t } = useTranslation();
  const [abnormalOnly, setAbnormalOnly] = useState(false);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [
      "observations",
      patientId,
      encounterId,
      "latest",
      codes.map(codeKey),
    ],
    queryFn: query(observationApi.analyse, {
      pathParams: { patientId },
      queryParams: { encounter: encounterId },
      body: { codes, page_size: READINGS_PER_CODE },
      silent: true,
    }),
    enabled: codes.length > 0,
  });
  const { rows, columns } = useMemo(
    () => buildMatrix(data?.results ?? [], codes),
    [codes, data?.results],
  );
  const visibleColumns = columns.slice(0, VISIBLE_READINGS);
  const isAbnormal = (row: VitalRow) =>
    visibleColumns.some((column) => row.cells.get(column.key)?.flag);
  const abnormalRows = rows.filter(isAbnormal).length;
  const shownRows =
    abnormalOnly && abnormalRows ? rows.filter(isAbnormal) : rows;
  const loading = isLoading && codes.length > 0;

  if (!loading && !isError && !columns.length && !showEmpty) return null;

  const latestCell = visibleColumns[0]
    ? rows
        .map((row) => row.cells.get(visibleColumns[0].key))
        .find((cell) => cell)
    : undefined;
  const latestBy = latestCell
    ? formatName(
        latestCell.observation.data_entered_by ??
          latestCell.observation.created_by,
      )
    : undefined;

  const actions = columns.length ? (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
      {abnormalRows > 0 && (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-soft-foreground">
          <Switch
            size="sm"
            checked={abnormalOnly}
            onCheckedChange={setAbnormalOnly}
          />
          {t("workspace_vitals_abnormal_only")}
        </label>
      )}
      <ObservationDetailSheet
        codes={codes}
        title={title}
        patientId={patientId}
        encounterId={encounterId}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-soft-foreground"
          >
            <History className="size-3.5" aria-hidden="true" />
            {t("workspace_vitals_all_readings")}
          </Button>
        }
      />
    </div>
  ) : undefined;

  return (
    <VitalsPanel title={title} actions={actions}>
      {loading ? (
        <div role="status" aria-label={t("loading")}>
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <ClinicalListError isFetching={isFetching} onRetry={refetch} />
      ) : !columns.length ? (
        <p className="p-2 text-sm text-soft-foreground">
          {t("no_vitals_recorded")}
        </p>
      ) : (
        <div className="-mx-2 -mb-2 min-w-0">
          <p className="px-3 pb-2 text-xs text-soft-foreground">
            {t("workspace_vitals_matrix_summary", {
              count: visibleColumns.length,
              name: latestBy,
            })}
          </p>
          <div
            tabIndex={0}
            className="min-w-0 max-w-full overflow-x-auto focus-visible:ring-2 focus-visible:ring-ring"
          >
            <table className="min-w-max border-separate border-spacing-0 text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 border-y border-border bg-card px-3 py-2 text-left text-xs font-medium text-soft-foreground"
                  >
                    {t("component")}
                  </th>
                  {visibleColumns.map((column, index) => (
                    <th
                      key={column.key}
                      scope="col"
                      aria-label={
                        index === 0
                          ? `${t("workspace_vitals_latest")} ${columnLabel(column.time, visibleColumns[index - 1]?.time, t)}`
                          : undefined
                      }
                      className={cn(
                        "border-y border-border px-3 py-2 text-right text-xs font-medium whitespace-nowrap",
                        index === 0
                          ? "bg-primary/5 text-primary"
                          : "text-soft-foreground",
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {index === 0 && (
                          <span
                            aria-hidden="true"
                            className="size-1.5 rounded-full bg-primary"
                          />
                        )}
                        <time
                          dateTime={column.time}
                          title={formatDateTime(column.time)}
                        >
                          {columnLabel(
                            column.time,
                            visibleColumns[index - 1]?.time,
                            t,
                          )}
                        </time>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shownRows.map((row) => (
                  <tr key={codeKey(row.code)}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-b border-soft-border bg-card px-3 py-2 text-left font-normal"
                    >
                      <div className="flex min-w-36 items-baseline justify-between gap-3">
                        <ObservationDetailSheet
                          codes={[row.code]}
                          title={row.code.display ?? row.code.code}
                          patientId={patientId}
                          encounterId={encounterId}
                          trigger={
                            <button
                              type="button"
                              className="rounded-sm text-left font-medium text-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                              {row.code.display ?? row.code.code}
                            </button>
                          }
                        />
                        {(row.range || row.unit) && (
                          <span className="text-xs whitespace-nowrap text-placeholder-foreground">
                            {row.range
                              ? `(${[row.range, row.unit].filter(Boolean).join(" ")})`
                              : row.unit}
                          </span>
                        )}
                      </div>
                    </th>
                    {visibleColumns.map((column, index) => (
                      <VitalMatrixCell
                        key={column.key}
                        cell={row.cells.get(column.key)}
                        latest={index === 0}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </VitalsPanel>
  );
}

function columnLabel(time: string, previous: string | undefined, t: TFunction) {
  const date = dayjs(time);
  const clock = date.format("hh:mm A");
  if (previous && date.isSame(previous, "day")) return clock;
  const day = date.isSame(dayjs(), "day")
    ? t("workspace_vitals_today")
    : date.isSame(dayjs().subtract(1, "day"), "day")
      ? t("workspace_vitals_yesterday")
      : date.format("DD MMM");
  return `${day} · ${clock}`;
}

const FLAG_ICONS = {
  high: ArrowUpRight,
  low: ArrowDownRight,
  abnormal: TriangleAlert,
} as const;

function VitalMatrixCell({
  cell,
  latest,
}: {
  cell?: VitalCell;
  latest: boolean;
}) {
  const { t } = useTranslation();
  if (!cell) {
    return (
      <td
        className={cn(
          "border-b border-soft-border px-3 py-2 text-right text-placeholder-foreground",
          latest && "bg-primary/5",
        )}
        aria-label={t("workspace_vitals_no_reading")}
      >
        {t("workspace_vitals_no_reading")}
      </td>
    );
  }
  const FlagIcon = cell.flag ? FLAG_ICONS[cell.flag] : undefined;
  return (
    <td
      title={cell.interpretation}
      aria-label={[
        cell.text,
        cell.unit,
        cell.flag
          ? (cell.interpretation ?? t(`workspace_vitals_flag_${cell.flag}`))
          : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      className={cn(
        "border-b border-soft-border px-3 py-2 text-right whitespace-nowrap tabular-nums",
        cell.flag
          ? "bg-warning-50 font-semibold text-warning-900 dark:bg-warning-950/40 dark:text-warning-200"
          : latest
            ? "bg-primary/5 font-medium text-foreground"
            : "text-muted-foreground",
      )}
    >
      <span className="inline-flex items-center justify-end gap-1">
        {cell.text}
        {cell.unit && (
          <span className="whitespace-pre text-xs text-placeholder-foreground">
            {" "}
            {cell.unit}
          </span>
        )}
        {FlagIcon && (
          <FlagIcon className="size-3.5 shrink-0" aria-hidden="true" />
        )}
      </span>
    </td>
  );
}
