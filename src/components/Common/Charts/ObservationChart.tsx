import { useQuery } from "@tanstack/react-query";
import { format, roundToNearestMinutes, subHours } from "date-fns";
import { CopyPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar } from "@/components/Common/Avatar";

import { cn } from "@/lib/utils";
import { Code } from "@/types/base/code/code";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";

import observationApi from "@/types/emr/observation/observationApi";

import { ObservationHistoryTable } from "./ObservationHistoryTable";
interface CodeGroup {
  codes: Code[];
  title: string;
  yAxisDomain?: [number, number];
  color?: string;
}

interface ObservationVisualizerProps {
  patientId: string;
  codeGroups: CodeGroup[];
  height?: number;
  gridCols?: number;
  encounterId: string;
}

interface ChartData {
  timestamp: string;
  time: number;
  [key: string]: string | number | ObservationDetails | undefined;
}

interface ObservationDetails {
  value: number;
  enteredBy: string;
  enteredAt: string;
  note?: string;
  status: string;
}

const DEFAULT_COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#ea580c", // orange-600
  "#9333ea", // purple-600
  "#0d9488", // teal-600
  "#2563eb", // blue-600
  "#c026d3", // fuchsia-600
  "#ca8a04", // yellow-600
  "#0891b2", // cyan-600
] as const;

type TimeRange = "1H" | "6H" | "12H" | "24H" | "48H" | "72H" | "ALL";

const PRIMARY_TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "1H", label: "1H" },
  { value: "24H", label: "24H" },
];

const MORE_TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "6H", label: "6 Hours" },
  { value: "12H", label: "12 Hours" },
  { value: "48H", label: "48 Hours" },
  { value: "72H", label: "72 Hours" },
  { value: "ALL", label: "All Data" },
];

function getTimeRangeLabel(range: TimeRange): string {
  const allOptions = [...PRIMARY_TIME_OPTIONS, ...MORE_TIME_OPTIONS];
  return allOptions.find((o) => o.value === range)?.label || range;
}

const TIME_RANGE_HOURS: Record<Exclude<TimeRange, "ALL">, number> = {
  "1H": 1,
  "6H": 6,
  "12H": 12,
  "24H": 24,
  "48H": 48,
  "72H": 72,
};

function getTimeRangeStartDate(range: TimeRange): Date | null {
  if (range === "ALL") return null;
  return subHours(new Date(), TIME_RANGE_HOURS[range]);
}

const formatXAxisTick = (value: number, timeRange: TimeRange): string => {
  const date = new Date(value);

  if (["1H", "6H", "12H"].includes(timeRange)) {
    return format(date, "h:mm a");
  }
  if (["24H", "48H", "72H"].includes(timeRange)) {
    return `${format(date, "h:mm a")}\n${format(date, "dd/MM")}`;
  }
  return format(date, "dd/MM/yy");
};

const roundToNearestMinute = (dateString: string): string =>
  roundToNearestMinutes(new Date(dateString), { nearestTo: 1 }).toISOString();

const formatChartDate = (
  dateString: string,
): { display: string; time: number } => {
  const date = new Date(dateString);
  return {
    display: formatDateTime(date, "hh:mm A; DD/MM/YYYY"),
    time: date.getTime(),
  };
};

export const ObservationVisualizer = ({
  patientId,
  codeGroups,
  encounterId,
  height = 300,
  gridCols = 2,
}: ObservationVisualizerProps) => {
  const { t } = useTranslation();
  const [timeRanges, setTimeRanges] = useState<Record<number, TimeRange>>({});
  const getTimeRange = (index: number): TimeRange => timeRanges[index] || "ALL";

  const setTimeRange = (index: number, range: TimeRange) => {
    setTimeRanges((prev) => ({ ...prev, [index]: range }));
  };

  const applyToAll = (range: TimeRange) => {
    const newRanges: Record<number, TimeRange> = {};
    codeGroups.forEach((_, index) => {
      newRanges[index] = range;
    });
    setTimeRanges(newRanges);
  };

  // Flatten all codes for a single API request
  const allCodes = codeGroups.flatMap((group) => group.codes);

  const { data, isLoading } = useQuery({
    queryKey: [
      "observations",
      patientId,
      encounterId,
      allCodes.map((c) => c.code).join(","),
    ],

    queryFn: query(observationApi.analyse, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
      },
      body: {
        codes: allCodes,
      },
    }),
  });

  // Process data for each code group
  const processedDataByGroup = useMemo(() => {
    if (!data?.results?.length) return [];

    // Build a one-time lookup Map from code string to its resultGroup
    const resultByCode = new Map(data.results.map((rg) => [rg.code.code, rg]));

    return codeGroups.map((group, groupIndex) => {
      const groupTimeRange = timeRanges[groupIndex] || "ALL";
      const startDate = getTimeRangeStartDate(groupTimeRange);
      const processedData: { [key: string]: ChartData } = {};

      // First, collect all timestamps from all codes in the group
      const allTimestamps = new Set<string>();
      group.codes.forEach((code) => {
        const resultGroup = resultByCode.get(code.code);
        if (!resultGroup) return;

        resultGroup.results.forEach((observation) => {
          if (observation.effective_datetime) {
            // Filter by time range
            const observationDate = new Date(observation.effective_datetime);
            if (!startDate || observationDate >= startDate) {
              // Round to nearest minute to group related observations
              allTimestamps.add(
                roundToNearestMinute(observation.effective_datetime),
              );
            }
          }
        });
      });

      // Create entries for all timestamps
      Array.from(allTimestamps).forEach((timestamp) => {
        const { display, time } = formatChartDate(timestamp);
        processedData[timestamp] = {
          timestamp: display,
          time,
        };
      });

      // Then fill in the values for each code
      group.codes.forEach((code) => {
        const resultGroup = resultByCode.get(code.code);
        if (!resultGroup || !code.display) return;

        resultGroup.results.forEach((observation) => {
          const originalTimestamp = observation.effective_datetime;
          if (!originalTimestamp || typeof originalTimestamp !== "string")
            return;

          // Filter by time range
          const observationDate = new Date(originalTimestamp);
          if (startDate && observationDate < startDate) return;

          // Use rounded timestamp to match the key in processedData
          const roundedTimestamp = roundToNearestMinute(originalTimestamp);
          const value = Number(observation.value.value);
          if (
            !isNaN(value) &&
            roundedTimestamp in processedData &&
            code.display
          ) {
            const details: ObservationDetails = {
              value,
              enteredBy: formatName(observation.data_entered_by),
              enteredAt: formatChartDate(observation.effective_datetime)
                .display,
              note: observation.note || undefined,
              status: observation.status,
            };
            (processedData[roundedTimestamp] as ChartData)[code.display] =
              value;
            (processedData[roundedTimestamp] as ChartData)[
              `${code.display}_details`
            ] = details;
          }
        });
      });

      // Sort data by timestamp
      const sortedData = Object.values(processedData).sort(
        (a, b) => a.time - b.time,
      );

      return {
        ...group,
        data: sortedData,
        timeRange: groupTimeRange,
      };
    });
  }, [data, codeGroups, timeRanges]);

  if (isLoading) {
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {codeGroups.map((group, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="w-full" style={{ height: `${height}px` }} />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!data?.results?.length) {
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {codeGroups.map((group, index) => (
          <Card key={index} className="p-4">
            <div
              className="flex items-center justify-center text-gray-500"
              style={{ height: `${height}px` }}
            >
              {t("no_data_available")}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
    >
      {processedDataByGroup.map((group, groupIndex) => (
        <Card key={groupIndex} className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-medium">{group.title}</h3>
              <Popover>
                <PopoverTrigger className="px-0!">
                  <CareIcon
                    icon="l-info-circle"
                    className="size-4 text-gray-500 hover:text-gray-700 cursor-pointer"
                  />
                </PopoverTrigger>
                <PopoverContent
                  className="max-w-fit w-[calc(100vw-2rem)] sm:max-w-fit sm:w-auto wrap-break-word"
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  collisionPadding={16}
                >
                  <div className="space-y-2">
                    <div className="font-medium">{t("observations")}:</div>
                    {group.codes.map((code) => (
                      <div key={code.code} className="text-xs">
                        {code.display} ({code.code})
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <ButtonGroup>
              {PRIMARY_TIME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs",
                    getTimeRange(groupIndex) === option.value &&
                      "bg-gray-100 border-gray-400 font-medium dark:bg-gray-800",
                  )}
                  onClick={() => setTimeRange(groupIndex, option.value)}
                >
                  {option.label}
                </Button>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 px-2",
                      !PRIMARY_TIME_OPTIONS.find(
                        (o) => o.value === getTimeRange(groupIndex),
                      ) &&
                        "bg-gray-100 border-gray-400 font-medium dark:bg-gray-800",
                    )}
                  >
                    {!PRIMARY_TIME_OPTIONS.find(
                      (o) => o.value === getTimeRange(groupIndex),
                    ) ? (
                      <span className="text-xs">
                        {getTimeRangeLabel(getTimeRange(groupIndex))}
                        <CareIcon icon="l-angle-down" className="size-4" />
                      </span>
                    ) : (
                      <CareIcon icon="l-angle-down" className="size-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {MORE_TIME_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setTimeRange(groupIndex, option.value)}
                      className={cn(
                        "cursor-pointer",
                        getTimeRange(groupIndex) === option.value &&
                          "bg-gray-100 font-medium",
                      )}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                  {codeGroups.length > 1 && (
                    <DropdownMenuItem
                      onClick={() => applyToAll(getTimeRange(groupIndex))}
                      className="border-t text-primary-600 cursor-pointer"
                    >
                      <CopyPlus className="size-4" />
                      {t("apply_to_all_charts")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
          <Tabs defaultValue="graph" className="w-full">
            <TabsList className="flex w-full">
              <TabsTrigger className="flex-1" value="graph">
                {t("graph")}
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="data">
                {t("recent_data")}
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="history">
                {t("full_history")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph">
              <div style={{ height: `${height}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={group.data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      scale="time"
                      tickFormatter={(value) =>
                        formatXAxisTick(value, group.timeRange)
                      }
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      domain={group.yAxisDomain || ["auto", "auto"]}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      labelFormatter={(value) => {
                        if (typeof value === "number") {
                          const date = new Date(value);
                          return formatChartDate(date.toISOString()).display;
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    {group.codes.map((code, codeIndex) => {
                      if (!code.display) return null;
                      return (
                        <Line
                          key={code.code}
                          type="monotone"
                          dataKey={code.display}
                          stroke={
                            group.color ||
                            DEFAULT_COLORS[codeIndex % DEFAULT_COLORS.length]
                          }
                          dot={true}
                          connectNulls
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="data">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Values</TableHead>
                      <TableHead>Entered By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.data.map((row) => {
                      // Get all observations for this timestamp
                      const observations = group.codes
                        .map((code) => {
                          if (!code.display) return null;
                          const details = row[`${code.display}_details`] as
                            | ObservationDetails
                            | undefined;
                          if (!details) return null;
                          return {
                            code,
                            details,
                          };
                        })
                        .filter((x): x is NonNullable<typeof x> => x !== null);

                      if (observations.length === 0) return null;

                      return (
                        <TableRow key={row.timestamp}>
                          <TableCell>{row.timestamp}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {observations.map(({ code, details }) => (
                                <div
                                  key={code.code}
                                  className="flex items-center gap-2"
                                >
                                  <span className="font-medium">
                                    {code.display}:
                                  </span>
                                  <span>{details.value}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={observations[0].details.enteredBy}
                                className="size-6"
                              />
                              <span>{observations[0].details.enteredBy}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {observations.map(
                                ({ code, details }) =>
                                  details.note && (
                                    <div
                                      key={code.code}
                                      className="text-sm text-gray-500"
                                    >
                                      <span className="font-medium">
                                        {code.display}:
                                      </span>{" "}
                                      {details.note}
                                    </div>
                                  ),
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ObservationHistoryTable
                patientId={patientId}
                encounterId={encounterId}
                codes={group.codes}
              />
            </TabsContent>
          </Tabs>
        </Card>
      ))}
    </div>
  );
};
