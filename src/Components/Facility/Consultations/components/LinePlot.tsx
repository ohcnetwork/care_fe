import ReactECharts from "echarts-for-react";

export const LinePlot = (props: any) => {
  const { title, name, xData, yData, low = null, high = null } = props;
  let generalOptions = {
    title: {
      text: `${title} [ {0|${yData[yData.length - 1]?.toFixed(2) || "NA"}} ]`,
      textStyle: {
        fontSize: 20,
        rich: {
          0: {
            fontSize: 14,
            fontWeight: "bold",
            padding: [0, 5],
            color: "#5470C6",
          },
        },
      },
    },
    legend: {
      data: [name],
      type: "scroll",
      bottom: "3%",
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
    series: [
      {
        name: name,
        type: "line",
        stack: name,
        data: yData,
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            opacity: 0.5,
            colorStops: [
              {
                offset: 0,
                color: "blue",
              },
              {
                offset: 1,
                color: "white",
              },
            ],
          },
        },
        connectNulls: true,
      },
    ],
  };

  const visualMap: any = {
    visualMap: {
      type: "piecewise",
      show: false,
      dimension: 1,
      pieces: [
        {
          gt: high,
          color: "red",
        },
        {
          lte: high,
          gte: low,
          color: "blue",
        },
        {
          lt: low,
          color: "red",
        },
      ],
    },
  };

  if (high && low) {
    generalOptions = { ...generalOptions, ...visualMap };
  }

  return <ReactECharts option={generalOptions} />;
};
