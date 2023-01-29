import ReactECharts from "echarts-for-react";

export const LinePlot = (props: any) => {
  const {
    title,
    name,
    xData,
    yData,
    low = null,
    high = null,
    defaultSpace,
  } = props;
  let generalOptions: any = {
    grid: {
      top: "40px",
      left: "20px",
      right: "30px",
      containLabel: true,
    },
    title: {
      text: `${title} [ {0|${yData[yData.length - 1]?.toFixed(2) || "NA"}} ]`,
      textStyle: {
        fontSize: 14,
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

  if (props.type && props.type === "WAVEFORM") {
    generalOptions = {
      ...generalOptions,
      title: {
        text: "",
      },
      grid: {
        show: false,
        borderColor: "transparent",
        left: "40px",
        right: "20px",
      },
      animation: false,
      xAxis: {
        ...generalOptions.xAxis,
        show: false,
      },
      yAxis: {
        ...generalOptions.yAxis,
        show: true,
        min: props.yStart,
        max: props.yEnd,
        splitLine: {
          lineStyle: {
            color: "#4E4E4E",
          },
        },
      },
      toolbox: {
        ...generalOptions.toolbox,
        show: false,
      },
      legend: {
        show: false,
      },
      series: [
        {
          ...generalOptions.series[0],
          showSymbol: false,
          lineStyle: { color: props.color },
          areaStyle: {
            ...generalOptions.series[0].areaStyle,
            color: {
              ...generalOptions.series[0].areaStyle.color,
              colorStops: [
                {
                  offset: 0,
                  color: "transparent",
                },
                {
                  offset: 1,
                  color: "transparent",
                },
              ],
            },
          },
          connectNulls: false,
        },
      ],
    };
  }

  if (props.type === "WAVEFORM" && defaultSpace != true) {
    generalOptions = {
      ...generalOptions,
      grid: {
        ...generalOptions.grid,
        top: "20px",
        bottom: "20px",
      },
    };
  }

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

  return (
    <ReactECharts
      option={generalOptions}
      className={props.classes}
      lazyUpdate={props.type === "WAVEFORM"}
    />
  );
};
