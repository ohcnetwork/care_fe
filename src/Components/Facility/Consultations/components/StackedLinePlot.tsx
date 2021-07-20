import ReactECharts from "echarts-for-react";

export const StackedLinePlot = (props: any) => {
  const { title, xData, yData } = props;

  const series = yData.map((x: any) => ({
    name: x.name,
    type: "line",
    stack: x.name,
    data: x.data,
    connectNulls: true,
  }));

  const generalOptions = {
    title: {
      text: title,
    },

    legend: {
      data: yData.map((x: any) => x.name),
    },
    tooltip: {
      trigger: "axis",
    },
    toolbox: {
      show: true,
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
        width: 100,
        overflow: "break",
      },
    },
    yAxis: {
      type: "value",
    },
    series: series,
  };
  return <ReactECharts option={generalOptions} />;
};
