import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { Code } from "@/types/base/code/code";
import { ObservationListRead } from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";

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
    queryFn: query(observationApi.analyse, {
      pathParams: { patientId },
      ...(currentEncounterOnly && encounterId
        ? { queryParams: { encounter: encounterId } }
        : {}),
      body: { codes: [code] },
    }),
  });

  const results: ObservationListRead[] = data?.results?.[0]?.results ?? [];

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
      const value = Number(obs.value?.value);
      if (isNaN(value)) return null;
      return { time: new Date(obs.effective_datetime).getTime(), value };
    })
    .filter((entry): entry is { time: number; value: number } => entry !== null)
    .sort((a, b) => a.time - b.time);

  // One tick per calendar day (first reading of the day) to avoid overlapping
  // date labels when multiple readings share the same day.
  const dayTicks = Array.from(
    chartData
      .reduce((acc, d) => {
        const day = format(new Date(d.time), "yyyy-MM-dd");
        if (!acc.has(day)) acc.set(day, d.time);
        return acc;
      }, new Map<string, number>())
      .values(),
  );

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

  const values = chartData.map((d) => d.value);
  const dataMin = values.length ? Math.min(...values) : 0;
  const dataMax = values.length ? Math.max(...values) : 0;
  const yMin = Math.min(dataMin, refMin ?? dataMin);
  const yMax = Math.max(dataMax, refMax ?? dataMax);
  const pad = (yMax - yMin || 1) * 0.2;

  if (isLoading) {
    return <Loading />;
  }

  if (chartData.length === 0 && tableRows.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        {t("no_data_available")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={dayTicks}
                interval={0}
                tickFormatter={(value) =>
                  isToday(new Date(value))
                    ? t("today")
                    : format(new Date(value), "d MMM")
                }
                tickLine={false}
                axisLine={{ stroke: "#6b7280" }}
                tick={{ fontSize: 12, fill: "#6b7280" }}
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
                isAnimationActive={false}
              >
                <LabelList dataKey="value" content={renderValueLabel} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-50">
              <TableHead>{t("time")}</TableHead>
              <TableHead>{t("value")}</TableHead>
              <TableHead>{t("entered_by")}</TableHead>
              <TableHead>{t("notes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableRows.map((obs) => {
              const name = formatName(obs.data_entered_by);
              return (
                <TableRow key={obs.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(obs.effective_datetime, "HH:mm DD/MM/YYYY")}
                  </TableCell>
                  <TableCell>
                    {obs.value?.value ?? "-"}
                    {obs.value?.value && unit ? ` ${unit}` : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={name} className="size-6" />
                      <span>{name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {obs.note}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="appearance-none border-0 bg-transparent p-0 text-left text-inherit">
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-4xl flex flex-col p-0 gap-0 overflow-hidden h-dvh">
        <SheetHeader className="p-6 pb-4 bg-white">
          <SheetTitle className="text-gray-950 text-lg">{title}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto p-4 flex-1 min-h-0">
          {encounterId && (
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={currentEncounterOnly}
                onCheckedChange={(checked) =>
                  setCurrentEncounterOnly(checked === true)
                }
              />
              <span>{t("show_current_encounter_recordings")}</span>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
