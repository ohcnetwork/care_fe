import { useInfiniteQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Pin } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Code } from "@/types/base/code/code";
import {
  ObservationListRead,
  ObservationStatus,
} from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import { toNumber } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

interface ObservationDetailSheetProps {
  children: React.ReactNode;
  codes: Code[];
  title: string;
  patientId: string;
  encounterId?: string;
}

const DEFAULT_COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#ea580c", // orange-600
  "#9333ea", // purple-600
  "#0d9488", // teal-600
  "#c026d3", // fuchsia-600
  "#ca8a04", // yellow-600
  "#0891b2", // cyan-600
] as const;

const POINT_WIDTH = 56;

interface ResolvedObservationEntry {
  code: Code;
  time: number;
  value?: string | null;
  unit?: Code;
  enteredBy: string;
  note?: string | null;
}

function resolveObservationEntries(
  results: ObservationListRead[],
): Record<string, ResolvedObservationEntry[]> {
  const groupedObj: Record<string, ResolvedObservationEntry[]> = {};

  for (const obs of results) {
    if (
      !obs.effective_datetime ||
      obs.status === ObservationStatus.ENTERED_IN_ERROR
    )
      continue;

    const time = new Date(obs.effective_datetime).getTime();
    const enteredBy = formatName(obs.data_entered_by);

    const entries = obs.component?.length
      ? obs.component
          .filter((component) => component.code?.code)
          .map((component) => ({
            code: component.code!,
            value: component.value?.value,
            unit: component.value?.unit,
            time,
            enteredBy,
            note: component.note ?? obs.note,
          }))
      : obs.main_code?.code
        ? [
            {
              code: obs.main_code,
              value: obs.value?.value,
              unit: obs.value?.unit,
              time,
              enteredBy,
              note: obs.note,
            },
          ]
        : [];

    for (const entry of entries) {
      const key = entry.code.code;
      (groupedObj[key] ??= []).push(entry);
    }
  }

  for (const entries of Object.values(groupedObj)) {
    entries.sort((a, b) => a.time - b.time);
  }

  return groupedObj;
}

function getRecordingSummary(results: ObservationListRead[]) {
  const dated = results.filter((obs) => obs.effective_datetime);
  if (dated.length === 0) return { count: 0, range: "" };

  const times = dated.map((obs) => new Date(obs.effective_datetime).getTime());
  const buckets = new Set(
    dated.map((obs) =>
      format(new Date(obs.effective_datetime).getTime(), "yyyy-MM-dd'T'HH:mm"),
    ),
  );
  const min = Math.min(...times);
  const max = Math.max(...times);
  const range =
    format(min, "d MMM") === format(max, "d MMM")
      ? format(min, "d MMM")
      : `${format(min, "d MMM")} → ${format(max, "d MMM")}`;
  return { count: buckets.size, range };
}

interface ObservationDetailContentProps {
  entries: ResolvedObservationEntry[];
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
}

function ObservationDetailContent({
  entries,
  hasNextPage,
  fetchNextPage,
}: ObservationDetailContentProps) {
  const { t } = useTranslation();

  const { ref: loadMoreRef, inView } = useInView();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage?.();
  }, [inView, hasNextPage, fetchNextPage]);

  const unit = entries[0]?.unit?.display || entries[0]?.unit?.code || "";

  const chartData = entries
    .map((entry) => {
      const value = !!entry.value === true ? toNumber(entry.value) : null;
      if (value === null) return null;
      return {
        time: entry.time,
        value,
      };
    })
    .filter(
      (
        entry,
      ): entry is {
        time: number;
        value: number;
      } => entry !== null,
    );

  const lastIndex = chartData.length - 1;

  const isDense = chartData.length > 12;
  const chartMinWidth = chartData.length * POINT_WIDTH;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || didInitialScroll.current || chartData.length === 0) return;
    el.scrollLeft = el.scrollWidth;
    didInitialScroll.current = true;
  }, [chartData.length]);

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
    const dateLabel = isToday(new Date(value))
      ? t("today")
      : format(new Date(value), "d MMM");
    const timeLabel = format(new Date(value), "h:mma");
    return (
      <text
        x={x}
        y={Number(y) + 14}
        textAnchor="middle"
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
  const yMin = values.length ? Math.min(...values) : 0;
  const yMax = values.length ? Math.max(...values) : 0;
  const pad = (yMax - yMin || 1) * 0.2;

  return (
    <div className="flex flex-col gap-8">
      {chartData.length > 0 && (
        <div className="relative mt-2" style={{ height: 320 }}>
          <div className="pointer-events-none absolute right-4 top-1 z-10 text-xs text-gray-500">
            {t("newest")} →
          </div>
          <div className="h-full overflow-x-auto" ref={scrollContainerRef}>
            <div
              className="relative h-full"
              style={{ minWidth: chartMinWidth }}
            >
              {hasNextPage && (
                <div
                  ref={loadMoreRef}
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-2"
                />
              )}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 32, right: 72, left: 40, bottom: 8 }}
                >
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
                    dot={{
                      r: isDense ? 2.5 : 4,
                      fill: "#16a34a",
                      stroke: "#16a34a",
                    }}
                    activeDot={{ r: 5, fill: "#16a34a" }}
                    isAnimationActive={chartData.length <= 50}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  >
                    <LabelList dataKey="value" content={renderValueLabel} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AllValuesChartProps {
  codeList: Code[];
  entriesByCode: Record<string, ResolvedObservationEntry[]>;
}

function AllValuesChart({ codeList, entriesByCode }: AllValuesChartProps) {
  const { t } = useTranslation();

  const rowsByTime = new Map<
    number,
    { time: number } & Record<string, number>
  >();

  for (const code of codeList) {
    for (const entry of entriesByCode[code.code] ?? []) {
      const numeric = !!entry.value === true ? toNumber(entry.value) : null;
      if (numeric === null) continue;
      const row = rowsByTime.get(entry.time) ?? { time: entry.time };
      row[code.code] = numeric;
      rowsByTime.set(entry.time, row);
    }
  }

  const chartData = Array.from(rowsByTime.values()).sort(
    (a, b) => a.time - b.time,
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        {t("no_data_available")}
      </div>
    );
  }

  return (
    <div className="mt-2" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
            tickFormatter={(value) => format(new Date(value), "d MMM, h:mm a")}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) =>
              typeof value === "number" ? formatDateTime(value) : value
            }
          />
          <Legend />
          {codeList.map((code, index) => (
            <Line
              key={code.code}
              type="monotone"
              name={code.display || code.code}
              dataKey={code.code}
              stroke={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              dot
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
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

  const validCodes = Object.values(
    codes
      .filter((code) => !!code?.code)
      .reduce(
        (acc, code) => {
          acc[code.code] = code;
          return acc;
        },
        {} as Record<string, (typeof codes)[0]>,
      ),
  );

  const codesParam = validCodes.map((c) => c.code).join(",");

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "observation-history",
      patientId,
      encounterId,
      codesParam,
      currentEncounterOnly,
    ],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(observationApi.list, {
        pathParams: { patientId },
        queryParams: {
          codes: codesParam,
          limit: String(RESULTS_PER_PAGE_LIMIT),
          offset: String(pageParam),
          ...(currentEncounterOnly && encounterId
            ? { encounter: encounterId }
            : {}),
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * RESULTS_PER_PAGE_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: open && validCodes.length > 0,
  });

  const allResults = useMemo(
    () => historyData?.pages.flatMap((page) => page.results) ?? [],
    [historyData],
  );

  const entriesByCode = useMemo(
    () => resolveObservationEntries(allResults),
    [allResults],
  );

  const summary = useMemo(() => getRecordingSummary(allResults), [allResults]);

  // Total recordings reported by the backend across all pages, not just the
  // pages loaded so far.
  const totalCount = historyData?.pages?.[0]?.count ?? 0;

  const codeList = useMemo(
    () => Object.values(entriesByCode).map((list) => list[0].code),
    [entriesByCode],
  );

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

          <div
            className={cn(
              "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-gray-500",
              summary.count === 0 && "hidden",
            )}
          >
            <span>
              {currentEncounterOnly && encounterId
                ? t("current_encounter")
                : t("all_encounters")}
            </span>
            {totalCount > 0 && (
              <>
                <span aria-hidden="true">•</span>
                <span>{t("recordings_count", { count: totalCount })}</span>
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

        {isHistoryLoading ? (
          <div className="flex flex-col gap-4 overflow-y-auto p-4 flex-1 min-h-0">
            <TableSkeleton count={3} />
          </div>
        ) : summary.count === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-500">
            {t("no_data_available")}
          </div>
        ) : (
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

            {codeList.length > 1 ? (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="bg-gray-100 max-w-full justify-start overflow-x-auto">
                  <TabsTrigger
                    value="all"
                    className="shrink-0 whitespace-nowrap"
                  >
                    {t("all_values")}
                  </TabsTrigger>
                  {codeList.map((code) => (
                    <TabsTrigger
                      key={code.code}
                      value={code.code}
                      className="shrink-0 whitespace-nowrap"
                    >
                      {code.display || code.code}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="all">
                  <AllValuesChart
                    codeList={codeList}
                    entriesByCode={entriesByCode}
                  />
                </TabsContent>
                {codeList.map((code) => (
                  <TabsContent key={code.code} value={code.code}>
                    <ObservationDetailContent
                      entries={entriesByCode[code.code] ?? []}
                      hasNextPage={hasNextPage}
                      fetchNextPage={fetchNextPage}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            ) : codeList.length === 1 ? (
              <ObservationDetailContent
                entries={entriesByCode[codeList[0].code] ?? []}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                {t("no_data_available")}
              </div>
            )}
            <ObservationHistoryMatrix
              title={t("observation_history")}
              codes={codeList}
              entriesByCode={entriesByCode}
              totalCount={totalCount}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

const ObservationHistoryMatrix = ({
  title,
  codes,
  entriesByCode,
  totalCount,
  hasNextPage,
  fetchNextPage,
}: {
  title: string;
  codes: Code[];
  entriesByCode: Record<string, ResolvedObservationEntry[]>;
  totalCount: number;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
}) => {
  const { t } = useTranslation();

  const firstColRef = useRef<HTMLTableCellElement>(null);
  const [pinnedOffset, setPinnedOffset] = useState(0);

  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage?.();
  }, [inView, hasNextPage, fetchNextPage]);

  const { columns, rows } = useMemo(() => {
    // One column per minute bucket, most recent first.
    const columnMap: Record<string, number> = {};
    for (const list of Object.values(entriesByCode)) {
      for (const entry of list) {
        const key = format(new Date(entry.time), "yyyy-MM-dd'T'HH:mm");
        const existing = columnMap[key];
        if (existing === undefined || entry.time > existing) {
          columnMap[key] = entry.time;
        }
      }
    }
    const columns = Object.entries(columnMap)
      .map(([key, time]) => ({ key, time }))
      .sort((a, b) => b.time - a.time);

    const rows = codes.map((code) => {
      const codeEntries = entriesByCode[code.code] ?? [];

      // Index each reading by its minute bucket, keeping the latest per bucket.
      const valuesByTime: Record<
        string,
        { time: number; value?: string | null }
      > = {};
      for (const entry of codeEntries) {
        const key = format(new Date(entry.time), "yyyy-MM-dd'T'HH:mm");
        const existing = valuesByTime[key];
        if (existing && entry.time <= existing.time) continue;

        valuesByTime[key] = {
          time: entry.time,
          value: entry.value,
        };
      }

      return {
        id: code.code,
        title: code.display || code.code,
        valuesByTime,
      };
    });

    return { columns, rows };
  }, [entriesByCode, codes]);

  // Dock the pinned column to the first column's real width so it never
  // overlaps when long content stretches the first column past its base width.
  useEffect(() => {
    const el = firstColRef.current;
    if (!el) return;
    const update = () => setPinnedOffset(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white mt-5">
      <div className="relative flex items-center gap-3 p-4">
        <span
          aria-hidden="true"
          className="absolute top-4 left-0 inset-y-6 w-1 rounded-r-lg bg-indigo-600 h-5"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-950">
            {title} ({t("recordings_count", { count: totalCount })})
          </h3>
          <p className="text-sm text-gray-700">
            {t("showing_all_readings", { count: totalCount })}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-gray-200 overflow-y-auto">
        <Table className="border-separate border-spacing-0 [&_td]:border-b [&_td]:border-gray-200 [&_th]:border-b [&_th]:border-gray-200">
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-50">
              <TableHead
                ref={firstColRef}
                className="sticky left-0 z-20 w-32 min-w-32 max-w-32 sm:w-64 sm:min-w-64 sm:max-w-64 border-r border-gray-200 bg-gray-50 text-gray-600"
              >
                {t("component")}
              </TableHead>
              {columns.map((col, index) => {
                const isLatest = index === 0;
                const isTodayCol = isToday(new Date(col.time));
                return (
                  <TableHead
                    key={col.key}
                    style={isLatest ? { left: pinnedOffset } : undefined}
                    className={cn(
                      "whitespace-nowrap border-r border-gray-200 bg-gray-100 text-center font-normal text-gray-600 last:border-r-0",
                      isLatest && "sticky z-20 bg-indigo-100",
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
              {hasNextPage && (
                <TableHead
                  ref={loadMoreRef}
                  aria-hidden="true"
                  className="w-2 min-w-2 border-r-0 bg-gray-100"
                />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                <TableCell className="sticky left-0 z-10 w-32 max-w-32 sm:w-64 sm:max-w-64 border-r border-gray-200 bg-white">
                  <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                    <span className="truncate font-semibold text-gray-950">
                      {row.title}
                    </span>
                  </div>
                </TableCell>
                {columns.map((col, index) => {
                  const entry = row.valuesByTime[col.key];
                  const isLatest = index === 0;
                  return (
                    <TableCell
                      key={col.key}
                      style={isLatest ? { left: pinnedOffset } : undefined}
                      className={cn(
                        "whitespace-nowrap border-r border-gray-200 text-center last:border-r-0 bg-white",
                        isLatest && "sticky z-10",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {entry?.value ?? "-"}
                      </span>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
