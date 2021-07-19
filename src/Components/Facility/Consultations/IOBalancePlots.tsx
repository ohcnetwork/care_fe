import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";

import ReactECharts from "echarts-for-react";

export const IOBalancePlots = (props: any) => {
  const { consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});
  const limit = 14;

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            limit,
            offset,
            fields: [
              "infusions",
              "iv_fluids",
              "feeds",
              "total_intake_calculated",
              "total_output_calculated",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setResults(res.data);
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, offset]
  );

  useAbortableEffect((status: statusType) => {
    fetchDailyRounds(status);
  }, []);

  const generalOptions = {
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
      data: Object.keys(results).map((p: string) => moment(p).format("LLL")),
    },
    yAxis: {
      type: "value",
    },
  };

  const infusionsOptions = {
    ...generalOptions,
    title: {
      text: "infusions",
    },
    legend: {
      data: [
        "Adrenalin",
        "Dopamine",
        "Nor-adrenalin",
        "Vasopressin",
        "Dobutamine",
      ],
    },
    series: [
      {
        name: "Adrenalin",
        type: "line",
        stack: "Adrenalin",
        smooth: true,
        data: Object.values(results)
          .map((p: any) =>
            p.infusions
              ? Object.values(p.infusions).map((v: any) =>
                  v.name === "Adrenalin" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
      {
        name: "Dopamine",
        type: "line",
        stack: "Dopamine",
        data: Object.values(results)
          .map((p: any) =>
            p.infusions
              ? Object.values(p.infusions).map((v: any) =>
                  v.name === "Dopamine" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
      {
        name: "Nor-adrenalin",
        type: "line",
        stack: "Nor-adrenalin",
        data: Object.values(results)
          .map((p: any) =>
            p.infusions
              ? Object.values(p.infusions).map((v: any) =>
                  v.name === "Nor-adrenalin" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
      {
        name: "Vasopressin",
        type: "line",
        stack: "Vasopressin",
        data: Object.values(results)
          .map((p: any) =>
            p.infusions
              ? Object.values(p.infusions).map((v: any) =>
                  v.name === "Vasopressin" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
      {
        name: "Dobutamine",
        type: "line",
        stack: "Dobutamine",
        data: Object.values(results)
          .map((p: any) =>
            p.infusions
              ? Object.values(p.infusions).map((v: any) =>
                  v.name === "Dobutamine" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
    ],
  };

  const ivFluidsOptions = {
    ...generalOptions,
    title: {
      text: "IV Fluids",
    },
    legend: {
      data: ["RL", "NS", "DNS"],
    },

    series: [
      {
        name: "RL",
        type: "line",
        stack: "RL",
        data: Object.values(results)
          .map((p: any) =>
            p.iv_fluids
              ? Object.values(p.iv_fluids).map((v: any) =>
                  v.name === "RL" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
      {
        name: "NL",
        type: "line",
        stack: "NL",
        data: Object.values(results)
          .map((p: any) =>
            p.iv_fluids
              ? Object.values(p.iv_fluids).map((v: any) =>
                  v.name === "NL" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
      {
        name: "DNS",
        type: "line",
        stack: "DNS",
        data: Object.values(results)
          .map((p: any) =>
            p.iv_fluids
              ? Object.values(p.iv_fluids).map((v: any) =>
                  v.name === "DNS" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
    ],
  };

  const feedsOptions = {
    ...generalOptions,
    title: {
      text: "Feeds",
    },
    legend: {
      data: ["Ryles Tube", "Normal Feed"],
    },

    series: [
      {
        name: "Ryles Tube",
        type: "line",
        stack: "Ryles Tube",
        data: Object.values(results)
          .map((p: any) =>
            p.feeds
              ? Object.values(p.feeds).map((v: any) =>
                  v.name === "Ryles Tube" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
      {
        name: "Normal Feed",
        type: "line",
        stack: "Normal Feed",
        data: Object.values(results)
          .map((p: any) =>
            p.feeds
              ? Object.values(p.feeds).map((v: any) =>
                  v.name === "Normal Feed" ? v.quantity : null
                )
              : null
          )
          .map((array) => array?.join("")),
      },
    ],
  };

  const totalIntakeOptions = {
    ...generalOptions,
    title: {
      text: "Total Intake",
    },
    legend: {
      data: ["Total Intake"],
    },
    series: [
      {
        name: "Total Intake",
        type: "line",
        stack: "Total Intake",
        smooth: true,
        data: Object.values(results).map((p: any) => p.total_intake_calculated),
        areaStyle: {},
      },
    ],
  };

  const totalOutputOptions = {
    ...generalOptions,
    title: {
      text: "Total output",
    },
    legend: {
      data: ["Total output"],
    },
    series: [
      {
        name: "Total output",
        type: "line",
        stack: "Total output",
        smooth: true,
        data: Object.values(results).map((p: any) => p.total_output_calculated),
        areaStyle: {},
      },
    ],
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <ReactECharts option={infusionsOptions} />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <ReactECharts option={ivFluidsOptions} />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <ReactECharts option={feedsOptions} />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <ReactECharts option={totalIntakeOptions} />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <ReactECharts option={totalOutputOptions} />
      </div>
    </div>
  );
};
