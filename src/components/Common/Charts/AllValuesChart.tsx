import { format } from "date-fns";
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

import { Code } from "@/types/base/code/code";
import { formatDateTime } from "@/Utils/utils";

import {
  ResolvedObservationEntry,
  toNumericValue,
} from "./observationDetailUtils";

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
          margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
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
          <Legend wrapperStyle={{ fontSize: 13 }} />
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
