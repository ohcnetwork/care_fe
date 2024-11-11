import { Suspense, lazy } from "react";

import CircularProgress from "@/components/Common/CircularProgress";

const ReactEcharts = lazy(
  () => import("@/components/Facility/Consultations/components/ReactEcharts"),
);

interface DataPoint {
  name: string;
  data: number[];
}

interface StackedLinePlotProps {
  title: string;
  xData: string[];
  yData: DataPoint[];
}
const COLORS = ["#B13F3C", "#2F8B35", "#44327A", "#B19D3C"];

export const StackedLinePlot = (props: StackedLinePlotProps) => {
  const { title, xData, yData } = props;

  const series = yData.map((x: any) => ({
    name: x.name,
    type: "line",
    stack: x.name,
    data: x.data.map((d: any) => Math.round(d * 100) / 100),
    connectNulls: true,
  }));

  const generalOptions = {
    grid: {
      left: "20px",
      right: "30px",
      containLabel: true,
    },
    color: COLORS,
    title: {
      text:
        title +
        " [ " +
        yData
          .map(
            (x: any, i: number) =>
              `{${i}|${x.data[x.data.length - 1]?.toFixed(2) ?? "NA"}}`,
          )
          .join(" | ") +
        " ] ",
      textStyle: {
        fontSize: 14,
        rich: Object.assign(
          {},
          COLORS.map((x: any) => ({
            fontSize: 14,
            fontWeight: "bold",
            padding: [0, 5],
            color: x,
          })),
        ),
      },
    },

    legend: {
      data: yData.map((x: any) => x.name),
      type: "scroll",
      bottom: "3%",
    },
    tooltip: {
      trigger: "axis",
      confine: true,
    },
    toolbox: {
      show: true,
      orient: "vertical",
      top: "9%",
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
        magicType: { type: ["line", "bar"] },
        saveAsImage: {},
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xData,
      axisLabel: {
        width: 60,
        overflow: "break",
        align: "center",
      },
    },
    yAxis: {
      type: "value",
    },
    series: series,
  };
  return (
    <Suspense
      fallback={
        <div className="grid h-16 place-items-center">
          <CircularProgress />
        </div>
      }
    >
      <ReactEcharts option={generalOptions} />
    </Suspense>
  );
};
