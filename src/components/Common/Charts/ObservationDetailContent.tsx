import { format, isToday } from "date-fns";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import {
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDateTime } from "@/Utils/utils";

import { Button } from "@/components/ui/button";
import {
  ResolvedObservationEntry,
  toNumericValue,
} from "./observationDetailUtils";

const POINT_WIDTH = 56;

interface ObservationDetailContentProps {
  entries: ResolvedObservationEntry[];
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function ObservationDetailContent({
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
      const value = toNumericValue(entry.value);
      if (value === null) return null;
      return {
        time: entry.time,
        value,
        enteredBy: entry.enteredBy,
        note: entry.note,
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
      <text x={x} y={y - 12} textAnchor="start" fontSize={12} fill="#374151">
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
      {chartData.length > 0 ? (
        <div className="relative mt-2" style={{ height: 320 }}>
          <Button
            variant="ghost"
            onClick={() => {
              const el = scrollContainerRef.current;
              if (el) {
                el.scrollTo({
                  left: el.scrollWidth,
                  behavior: "smooth",
                });
              }
            }}
            className="absolute right-4 top-1 z-10 text-xs text-gray-500 hover:text-gray-700"
          >
            {t("newest")} →
          </Button>

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
                  margin={{ top: 32, right: 72, left: 20, bottom: 8 }}
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
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-gray-500">
          {t("no_plottable_values")}
        </div>
      )}
    </div>
  );
}
