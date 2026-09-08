import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Loader,
  Pin,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { cn } from "@/lib/utils";
import { Code } from "@/types/base/code/code";
import { ObservationListRead } from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

interface ObservationDetailSheetProps {
  children: React.ReactNode;
  codes: Code[];
  title: string;
  patientId: string;
  encounterId?: string;
}

interface ObservationDetailContentProps {
  code: Code;
  patientId: string;
  encounterId?: string;
  currentEncounterOnly: boolean;
}

function ObservationDetailContent({
  code,
  patientId,
  encounterId,
  currentEncounterOnly,
}: ObservationDetailContentProps) {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: [
      "observation-detail",
      patientId,
      encounterId,
      code.code,
      currentEncounterOnly,
    ],
    queryFn: query(observationApi.list, {
      pathParams: { patientId },
      queryParams: {
        codes: code.code,
        limit: "1000",
        ...(currentEncounterOnly && encounterId
          ? { encounter: encounterId }
          : {}),
      },
    }),
  });

  const results: ObservationListRead[] = data?.results ?? [];

  const unitObs = results.find((obs) => obs.value?.unit);
  const unit =
    unitObs?.value?.unit?.display || unitObs?.value?.unit?.code || "";

  const range = results.find((obs) => obs.reference_range?.length)
    ?.reference_range?.[0];
  const refMin = range?.min;
  const refMax = range?.max;

  const chartData = results
    .map((obs) => {
      if (!obs.effective_datetime) return null;
      const rawValue = obs.value?.value;
      if (rawValue === null || rawValue === undefined || rawValue === "")
        return null;
      const value = Number(rawValue);
      if (isNaN(value)) return null;
      return {
        time: new Date(obs.effective_datetime).getTime(),
        value,
        enteredBy: formatName(obs.data_entered_by),
        note: obs.note,
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        time: number;
        value: number;
        enteredBy: string;
        note: string | null | undefined;
      } => entry !== null,
    )
    .sort((a, b) => a.time - b.time);

  // One tick per reading so each recorded time is shown individually.
  const timeTicks = chartData.map((d) => d.time);

  const tableRows = [...results]
    .filter((obs) => obs.effective_datetime)
    .sort(
      (a, b) =>
        new Date(b.effective_datetime).getTime() -
        new Date(a.effective_datetime).getTime(),
    );

  const lastIndex = chartData.length - 1;

  const renderValueLabel = (props: {
    x?: number | string;
    y?: number | string;
    value?: number | string | (number | string)[] | boolean | null;
    index?: number;
  }): React.ReactElement => {
    const x = Number(props.x);
    const y = Number(props.y);
    if (isNaN(x) || isNaN(y)) return <g />;

    if (props.index === lastIndex) {
      return (
        <g>
          <text x={x + 14} y={y - 4} fontSize={11} fill="#6b7280">
            {t("latest")}
          </text>
          <text
            x={x + 14}
            y={y + 13}
            fontSize={15}
            fontWeight={600}
            fill="#111827"
          >
            {props.value}
          </text>
        </g>
      );
    }

    return (
      <text x={x} y={y - 12} textAnchor="middle" fontSize={12} fill="#374151">
        {props.value}
      </text>
    );
  };

  // Only the first/last ticks get a label; anchor them inward so the edge
  // labels aren't clipped by the chart bounds.
  const renderXAxisTick = ({
    x,
    y,
    payload,
  }: {
    x?: number | string;
    y?: number | string;
    payload?: { value: number | string };
  }): React.ReactElement => {
    const value = Number(payload?.value);
    const isFirst = value === timeTicks[0];
    const isLast = value === timeTicks[timeTicks.length - 1];
    if (!isFirst && !isLast) return <g />;
    const dateLabel = isToday(new Date(value))
      ? t("today")
      : format(new Date(value), "d MMM");
    const timeLabel = format(new Date(value), "h:mma");
    return (
      <text
        x={x}
        y={Number(y) + 14}
        textAnchor={isFirst ? "start" : "end"}
        fontSize={12}
        fill="#6b7280"
      >
        <tspan x={x}>{dateLabel}</tspan>
        <tspan x={x} dy={16}>
          {timeLabel}
        </tspan>
      </text>
    );
  };

  const values = chartData.map((d) => d.value);
  const dataMin = values.length ? Math.min(...values) : 0;
  const dataMax = values.length ? Math.max(...values) : 0;
  const yMin = Math.min(dataMin, refMin ?? dataMin);
  const yMax = Math.max(dataMax, refMax ?? dataMax);
  const pad = (yMax - yMin || 1) * 0.2;

  if (isLoading) {
    return (
      <Loader className="mx-auto my-16 h-6 w-6 animate-spin text-gray-500" />
    );
  }

  if (chartData.length === 0 && tableRows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        {t("no_data_available")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {chartData.length > 0 && (
        <div className="relative mt-2" style={{ height: 320 }}>
          <div className="pointer-events-none absolute left-3 top-1 z-10 text-xs text-gray-500">
            ({t("ref")} {refMin ?? "-"}-{refMax ?? "-"} {unit})
          </div>
          <div className="pointer-events-none absolute right-4 top-1 z-10 text-xs text-gray-500">
            {t("newest")} →
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 32, right: 72, left: 20, bottom: 8 }}
            >
              {refMin !== undefined && refMax !== undefined && (
                <ReferenceArea
                  y1={refMin}
                  y2={refMax}
                  fill="#eff6ff"
                  fillOpacity={1}
                  ifOverflow="extendDomain"
                />
              )}
              <Tooltip
                cursor={{ stroke: "#9ca3af", strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as {
                    time: number;
                    value: number;
                    enteredBy: string;
                    note?: string | null;
                  };
                  return (
                    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
                      <div className="font-medium text-gray-900">
                        {point.value}
                        {unit ? ` ${unit}` : ""}
                      </div>
                      <div className="text-gray-500">
                        {formatDateTime(point.time)}
                      </div>
                      <div className="text-gray-500">{point.enteredBy}</div>
                      {point.note && (
                        <div className="mt-1 max-w-48 text-gray-500">
                          {point.note}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <XAxis
                dataKey="time"
                type="category"
                scale="point"
                interval={0}
                tickLine={{ stroke: "#374151" }}
                axisLine={{ stroke: "#6b7280" }}
                tick={renderXAxisTick}
              />
              <YAxis
                domain={[yMin - pad, yMax + pad]}
                tick={false}
                tickLine={false}
                axisLine={{ stroke: "#6b7280" }}
                width={1}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#9ca3af"
                strokeWidth={1.5}
                dot={{ r: 4, fill: "#16a34a", stroke: "#16a34a" }}
                activeDot={{ r: 5, fill: "#16a34a" }}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-in-out"
              >
                <LabelList dataKey="value" content={renderValueLabel} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function ObservationDetailSheet({
  children,
  codes,
  title,
  patientId,
  encounterId,
}: ObservationDetailSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [currentEncounterOnly, setCurrentEncounterOnly] = useState(false);

  const validCodes = Array.from(
    new Map(
      codes.filter((code) => !!code?.code).map((code) => [code.code, code]),
    ).values(),
  );

  const codesParam = validCodes.map((c) => c.code).join(",");

  // Shares the history table's query key so React Query dedupes the request.
  const { data: summaryData } = useQuery({
    queryKey: [
      "observation-history",
      patientId,
      encounterId,
      codesParam,
      currentEncounterOnly,
    ],
    queryFn: query(observationApi.list, {
      pathParams: { patientId },
      queryParams: {
        codes: codesParam,
        limit: "1000",
        ...(currentEncounterOnly && encounterId
          ? { encounter: encounterId }
          : {}),
      },
    }),
    enabled: open && validCodes.length > 0,
  });

  const summary = useMemo(() => {
    const results = summaryData?.results ?? [];
    const dated = results.filter((obs) => obs.effective_datetime);
    if (dated.length === 0) return { count: 0, range: "" };

    const times = dated.map((obs) =>
      new Date(obs.effective_datetime).getTime(),
    );
    const buckets = new Set(
      dated.map((obs) =>
        format(new Date(obs.effective_datetime), "yyyy-MM-dd'T'HH:mm"),
      ),
    );
    const min = Math.min(...times);
    const max = Math.max(...times);
    const range =
      format(min, "d MMM") === format(max, "d MMM")
        ? format(min, "d MMM")
        : `${format(min, "d MMM")} → ${format(max, "d MMM")}`;
    return { count: buckets.size, range };
  }, [summaryData]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="appearance-none border-0 bg-transparent p-0 text-left text-inherit">
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-4xl flex flex-col p-0 gap-0 overflow-hidden h-dvh">
        <SheetHeader className="border-b border-gray-200 bg-white p-6 pb-4">
          <SheetTitle className="pr-8 text-xl font-bold text-gray-950">
            {title}{" "}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-gray-500">
            <span>
              {currentEncounterOnly && encounterId
                ? t("current_encounter")
                : t("all_encounters")}
            </span>
            {summary.count > 0 && (
              <>
                <span aria-hidden="true">•</span>
                <span>{t("recordings_count", { count: summary.count })}</span>
              </>
            )}
            {summary.range && (
              <>
                <span aria-hidden="true">•</span>
                <span>{summary.range}</span>
              </>
            )}
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 flex-1 min-h-0">
          {encounterId && (
            <div className="flex items-center gap-2 text-sm ml-auto">
              <Checkbox
                id="current-encounter-only"
                checked={currentEncounterOnly}
                onCheckedChange={(checked) =>
                  setCurrentEncounterOnly(checked === true)
                }
              />
              <label
                htmlFor="current-encounter-only"
                className="cursor-pointer"
              >
                {t("show_current_encounter_recordings")}
              </label>
            </div>
          )}

          {validCodes.length > 1 ? (
            <Tabs defaultValue={validCodes[0].code} className="w-full">
              <TabsList className="bg-gray-100 max-w-full justify-start overflow-x-auto">
                {validCodes.map((code) => (
                  <TabsTrigger
                    key={code.code}
                    value={code.code}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {code.display || code.code}
                  </TabsTrigger>
                ))}
              </TabsList>
              {validCodes.map((code) => (
                <TabsContent key={code.code} value={code.code}>
                  <ObservationDetailContent
                    code={code}
                    patientId={patientId}
                    encounterId={encounterId}
                    currentEncounterOnly={currentEncounterOnly}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : validCodes.length === 1 ? (
            <ObservationDetailContent
              code={validCodes[0]}
              patientId={patientId}
              encounterId={encounterId}
              currentEncounterOnly={currentEncounterOnly}
            />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-gray-500">
              {t("no_data_available")}
            </div>
          )}
          <ObservationHistoryTable
            title={t("observation_history")}
            validCodes={validCodes}
            patientId={patientId}
            encounterId={encounterId}
            currentEncounterOnly={currentEncounterOnly}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

const ObservationHistoryTable = ({
  title,
  validCodes,
  patientId,
  encounterId,
  currentEncounterOnly,
}: {
  title: string;
  validCodes: Code[];
  patientId: string;
  encounterId?: string;
  currentEncounterOnly: boolean;
}) => {
  const { t } = useTranslation();

  const [abnormalOnly, setAbnormalOnly] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (offset: number) => {
    // shadcn's Table wraps the <table> in its own horizontally scrollable
    // container, so scroll that element rather than the outer wrapper.
    const container = scrollRef.current?.querySelector<HTMLElement>(
      '[data-slot="table-container"]',
    );
    container?.scrollBy({ left: offset, behavior: "smooth" });
  };

  const codes = useMemo(
    () => validCodes.filter((code) => !!code?.code),
    [validCodes],
  );

  const { data, isLoading } = useQuery({
    queryKey: [
      "observation-history",
      patientId,
      encounterId,
      codes.map((c) => c.code).join(","),
      currentEncounterOnly,
    ],
    queryFn: query(observationApi.list, {
      pathParams: { patientId },
      queryParams: {
        codes: codes.map((c) => c.code).join(","),
        limit: "1000",
        ...(currentEncounterOnly && encounterId
          ? { encounter: encounterId }
          : {}),
      },
    }),
  });

  const { columns, rows } = useMemo(() => {
    const results: ObservationListRead[] = data?.results ?? [];

    // Bucket readings by the minute so values recorded at the same time share
    // one column instead of splitting on differing seconds/milliseconds.
    const bucketKey = (iso: string) =>
      format(new Date(iso), "yyyy-MM-dd'T'HH:mm");

    // One column per minute bucket, most recent first.
    const columnMap = new Map<string, number>();
    for (const result of results) {
      if (result.effective_datetime) {
        const time = new Date(result.effective_datetime).getTime();
        const key = bucketKey(result.effective_datetime);
        const existing = columnMap.get(key);
        if (existing === undefined || time > existing) {
          columnMap.set(key, time);
        }
      }
    }
    const columns = Array.from(columnMap.entries())
      .map(([key, time]) => ({ key, time }))
      .sort((a, b) => b.time - a.time);

    const rows = codes.map((code) => {
      const codeResults = results.filter(
        (obs) => obs.main_code?.code === code.code,
      );

      const withUnit = codeResults.find((obs) => obs.value?.unit);
      const unit =
        withUnit?.value?.unit?.display || withUnit?.value?.unit?.code || "";
      const refRange = codeResults.find((obs) => obs.reference_range?.length)
        ?.reference_range?.[0];
      const refMin = refRange?.min;
      const refMax = refRange?.max;

      // Index each reading by its minute bucket, keeping the latest per bucket.
      const valuesByTime = new Map<
        string,
        {
          time: number;
          value?: string | null;
          abnormal: boolean;
          direction: "up" | "down" | null;
        }
      >();
      for (const result of codeResults) {
        if (!result.effective_datetime) continue;
        const time = new Date(result.effective_datetime).getTime();
        const key = bucketKey(result.effective_datetime);
        const existing = valuesByTime.get(key);
        if (existing && time <= existing.time) continue;

        // Abnormal = value falls outside the reference range.
        const numeric = Number(result.value?.value);
        let direction: "up" | "down" | null = null;
        if (!isNaN(numeric)) {
          if (refMax != null && numeric > refMax) direction = "up";
          else if (refMin != null && numeric < refMin) direction = "down";
        }

        valuesByTime.set(key, {
          time,
          value: result.value?.value,
          abnormal: direction !== null,
          direction,
        });
      }

      return {
        id: code.code,
        title: code.display || code.code,
        unit,
        refMin,
        refMax,
        valuesByTime,
        hasAbnormal: Array.from(valuesByTime.values()).some((e) => e.abnormal),
      };
    });

    return { columns, rows };
  }, [data, codes]);

  const visibleRows = useMemo(
    () => (abnormalOnly ? rows.filter((row) => row.hasAbnormal) : rows),
    [abnormalOnly, rows],
  );

  // When filtering, drop columns that hold no abnormal reading for any row.
  const visibleColumns = useMemo(
    () =>
      abnormalOnly
        ? columns.filter((col) =>
            visibleRows.some((row) => row.valuesByTime.get(col.key)?.abnormal),
          )
        : columns,
    [abnormalOnly, columns, visibleRows],
  );

  if (isLoading) {
    return <TableSkeleton count={3} />;
  }

  if (columns.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-gray-500">
        {t("no_data_available")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="relative flex items-center gap-3 p-4">
        <span
          aria-hidden="true"
          className="absolute top-4 left-0 inset-y-6 w-1 rounded-r-lg bg-indigo-600 h-5"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-950">
            {title} ({t("recordings_count", { count: columns.length })})
          </h3>
          <p className="text-sm text-gray-700">
            {abnormalOnly
              ? t("showing_abnormal_readings")
              : t("showing_all_readings", { count: columns.length })}
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-medium text-gray-700">
          <Switch checked={abnormalOnly} onCheckedChange={setAbnormalOnly} />
          {t("abnormal_only")}
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => scrollBy(-240)}
            aria-label={t("scroll_left")}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => scrollBy(240)}
            aria-label={t("scroll_right")}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div
        ref={scrollRef}
        className="overflow-x-auto border-t border-gray-200 overflow-y-auto"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-50">
              <TableHead className="w-64 min-w-64 max-w-64 border-r border-gray-200 bg-gray-50 text-gray-600">
                {t("component")}
              </TableHead>
              {visibleColumns.map((col, index) => {
                const isLatest = index === 0;
                const isTodayCol = isToday(new Date(col.time));
                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap border-r border-gray-200 bg-gray-100 text-center font-normal text-gray-600 last:border-r-0",
                      isLatest && "bg-indigo-50",
                    )}
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        {isLatest && (
                          <div className="size-2 bg-indigo-100 rounded-full border border-indigo-700" />
                        )}
                        {isTodayCol
                          ? t("today")
                          : format(new Date(col.time), "d MMM")}
                        {isLatest && <Pin className="size-3" />}
                      </span>
                      <span className="font-semibold text-gray-700">
                        {format(new Date(col.time), "h:mm a")}
                      </span>
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                <TableCell className="border-r border-gray-200">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-gray-950">
                      {row.title}
                    </span>
                    {(row.refMin != null || row.refMax != null) && (
                      <span className="whitespace-nowrap text-xs text-gray-500">
                        ({row.refMin ?? "-"} &ndash; {row.refMax ?? "-"}
                        {row.unit ? ` ${row.unit}` : ""})
                      </span>
                    )}
                  </div>
                </TableCell>
                {visibleColumns.map((col, index) => {
                  const entry = row.valuesByTime.get(col.key);
                  const isLatest = index === 0;
                  return (
                    <TableCell
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap border-r border-gray-200 text-center last:border-r-0",
                        isLatest &&
                          "border-x border-primary-100 bg-primary-50/60",
                        entry?.abnormal &&
                          "bg-orange-100 font-medium text-orange-700",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {abnormalOnly && !entry?.abnormal
                          ? "-"
                          : (entry?.value ?? "-")}
                        {entry?.abnormal && entry.direction === "up" && (
                          <ArrowUpRight className="size-3.5" />
                        )}
                        {entry?.abnormal && entry.direction === "down" && (
                          <ArrowDownRight className="size-3.5" />
                        )}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {visibleRows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumns.length + 1}
                  className="h-24 text-center text-sm text-gray-500"
                >
                  {t("no_abnormal_readings")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
