import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
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

import { Card } from "@/components/ui/card";
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
import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { ObservationAnalyzeResponse } from "@/types/emr/observation";
import { Code } from "@/types/questionnaire/code";

import { ObservationHistoryTable } from "./ObservationHistoryTable";

export type ObservationPlotConfig = {
  id: string;
  name: string;
  groups: {
    title: string;
    codes: Code[];
  }[];
}[];

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
  canAccess: boolean;
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

const formatChartDate = (
  dateString: string,
): { display: string; time: number } => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return {
    display: `${hours}:${minutes} ${day}/${month}/${year}`,
    time: date.getTime(),
  };
};

export const ObservationVisualizer = ({
  patientId,
  codeGroups,
  encounterId,
  height = 300,
  gridCols = 2,
  canAccess,
}: ObservationVisualizerProps) => {
  const { t } = useTranslation();

  // Flatten all codes for a single API request
  const allCodes = codeGroups.flatMap((group) => group.codes);

  const { data, isLoading } = useQuery<ObservationAnalyzeResponse>({
    queryKey: [
      "observations",
      patientId,
      encounterId,
      allCodes.map((c) => c.code).join(","),
    ],
    queryFn: query(routes.observationsAnalyse, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
      },
      body: {
        codes: allCodes,
      },
    }),
    enabled: canAccess,
  });

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
              No data available
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Process data for each code group
  const processedDataByGroup = codeGroups.map((group) => {
    const processedData: { [key: string]: ChartData } = {};

    // First, collect all timestamps from all codes in the group
    const allTimestamps = new Set<string>();
    group.codes.forEach((code) => {
      const resultGroup = data.results.find((rg) => rg.code.code === code.code);
      if (!resultGroup) return;

      resultGroup.results.forEach((observation) => {
        if (observation.effective_datetime) {
          allTimestamps.add(observation.effective_datetime);
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
      const resultGroup = data.results.find((rg) => rg.code.code === code.code);
      if (!resultGroup || !code.display) return;

      resultGroup.results.forEach((observation) => {
        const timestamp = observation.effective_datetime;
        if (!timestamp || typeof timestamp !== "string") return;

        const value =
          observation.value.value_quantity?.value ||
          Number(observation.value.value);
        if (!isNaN(value) && timestamp in processedData && code.display) {
          const details: ObservationDetails = {
            value,
            enteredBy: `${observation.data_entered_by.first_name} ${observation.data_entered_by.last_name}`,
            enteredAt: formatChartDate(observation.effective_datetime).display,
            note: observation.note || undefined,
            status: observation.status,
          };
          (processedData[timestamp] as ChartData)[code.display] = value;
          (processedData[timestamp] as ChartData)[`${code.display}_details`] =
            details;
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
    };
  });

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
    >
      {processedDataByGroup.map((group, groupIndex) => (
        <Card key={groupIndex} className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">{group.title}</h3>
              <TooltipProvider>
                <RadixTooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <div className="space-y-2">
                      <div className="font-medium">Observations:</div>
                      {group.codes.map((code) => (
                        <div key={code.code} className="text-xs">
                          {code.display} ({code.code})
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </RadixTooltip>
              </TooltipProvider>
            </div>
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
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
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
