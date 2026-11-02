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

interface ObservationLineChartProps {
  data: Record<string, unknown>[];
  yAxisDomain?: [number, number];
  lines: { key: string; dataKey: string; stroke: string }[];
  formatLabel: (timestamp: number) => string;
}

export default function ObservationLineChart({
  data,
  yAxisDomain,
  lines,
  formatLabel,
}: ObservationLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
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
          domain={yAxisDomain || ["auto", "auto"]}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          labelFormatter={(value) =>
            typeof value === "number" ? formatLabel(value) : value
          }
        />
        <Legend />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            dot={true}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
