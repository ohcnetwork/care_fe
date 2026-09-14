import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";

import { Code } from "@/types/base/code/code";
import { formatDateTime } from "@/Utils/utils";

import { RenderXAxisTick } from "@/components/Common/Charts/ObservationDetailContent";
import {
  ResolvedObservationEntry,
  toNumericValue,
} from "./observationDetailUtils";

const POINT_WIDTH = 56;

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

interface AllValuesChartProps {
  codeList: Code[];
  entriesByCode: Record<string, ResolvedObservationEntry[]>;
}

export function AllValuesChart({
  codeList,
  entriesByCode,
}: AllValuesChartProps) {
  const { t } = useTranslation();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  const rowsByTime = new Map<
    number,
    { time: number } & Record<string, number>
  >();

  for (const code of codeList) {
    for (const entry of entriesByCode[code.code] ?? []) {
      const numeric = toNumericValue(entry.value);
      if (numeric === null) continue;
      const row = rowsByTime.get(entry.time) ?? { time: entry.time };
      row[code.code] = numeric;
      rowsByTime.set(entry.time, row);
    }
  }

  const chartData = Array.from(rowsByTime.values()).sort(
    (a, b) => a.time - b.time,
  );

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || didInitialScroll.current || chartData.length === 0) return;
    el.scrollLeft = el.scrollWidth;
    didInitialScroll.current = true;
  }, [chartData.length]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        {t("no_data_available")}
      </div>
    );
  }

  const chartMinWidth = chartData.length * POINT_WIDTH;

  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="relative" style={{ height: 420 }}>
        <Button
          variant="link"
          onClick={() => {
            const el = scrollContainerRef.current;
            if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
          }}
          className="absolute right-4 top-0 z-10 text-xs text-gray-500 hover:text-gray-700"
        >
          {t("newest")} →
        </Button>

        <div className="h-full overflow-x-auto" ref={scrollContainerRef}>
          <div className="relative h-full" style={{ minWidth: chartMinWidth }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 32, right: 24, left: -2, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  type="category"
                  scale="point"
                  interval={0}
                  tickLine={{ stroke: "#374151" }}
                  axisLine={{ stroke: "#6b7280" }}
                  tick={RenderXAxisTick}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "#6b7280" }}
                  width={36}
                />
                <Tooltip
                  cursor={{ stroke: "#9ca3af", strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="max-w-72 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
                        <div className="mb-1 whitespace-nowrap text-gray-500">
                          {typeof label === "number"
                            ? formatDateTime(label)
                            : label}
                        </div>
                        <div>
                          {payload.map((entry) => (
                            <div
                              key={String(entry.dataKey)}
                              className="flex items-center gap-2 py-0.5"
                            >
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="min-w-0 flex-1 truncate text-gray-700">
                                {entry.name}
                              </span>
                              <span className="shrink-0 whitespace-nowrap pl-4 font-medium text-gray-900">
                                {entry.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }}
                />
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
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs mt-3">
        {codeList.map((code, index) => (
          <div key={code.code} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{
                backgroundColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
              }}
            />
            <span className="text-gray-700">{code.display || code.code}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
