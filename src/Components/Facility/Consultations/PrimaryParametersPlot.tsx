import moment from "moment";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import { StackedLinePlot } from "./components/StackedLinePlot";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";

export const PrimaryParametersPlot = (props: any) => {
  const { consultationId } = props;
  const dispatch: any = useDispatch();
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            page: currentPage,
            fields: [
              "pain",
              "bp",
              "pulse",
              "temperature",
              "resp",
              "blood_sugar_level",
              "insulin_intake_frequency",
              "insulin_intake_dose",
              "ventilator_spo2",
              "ventilator_fi02",
              "rhythm",
              "rhythm_detail",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setResults(res.data.results);
          setTotalCount(res.data.count);
        }
      }
    },
    [consultationId, dispatch, currentPage]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [consultationId, currentPage]
  );

  const handlePagination = (page: number) => {
    setCurrentPage(page);
  };

  const dates = Object.keys(results)
    .map((p: string) => moment(p).format("LLL"))
    .reverse();

  const yAxisData = (name: string) => {
    return Object.values(results)
      .map((p: any) => p[name])
      .reverse();
  };

  const BPData = [
    {
      name: "diastolic",
      data: Object.values(results)
        .map((p: any) => p.bp && p.bp.diastolic)
        .reverse(),
    },
    {
      name: "systolic",
      data: Object.values(results)
        .map((p: any) => p.bp && p.bp.systolic)
        .reverse(),
    },
    {
      name: "mean",
      data: Object.values(results)
        .map((p: any) => p.bp && p.bp.mean)
        .reverse(),
    },
  ];

  const InsulinData = [
    {
      name: "Blood Sugar Level",
      data: Object.values(results)
        .map((p: any) => p.blood_sugar_level)
        .reverse(),
    },
    {
      name: "Insulin Intake Frequency",
      data: Object.values(results)
        .map((p: any) => p.insulin_intake_frequency)
        .reverse(),
    },
    {
      name: "Insulin Dose",
      data: Object.values(results)
        .map((p: any) => p.insulin_intake_dose)
        .reverse(),
    },
  ];

  const rhythmValues: any = {};
  Object.entries(results).forEach((obj: any) => {
    if (obj[1].rhythm && obj[1].rhythm > 0) {
      const key: string = moment(obj[0]).format("LL");
      const lst: Array<any> = Object.prototype.hasOwnProperty.call(
        rhythmValues,
        key
      )
        ? rhythmValues[key]
        : [];
      const value: any = {};
      value["time"] = moment(obj[0]).format("LT");
      value["rhythm"] = obj[1].rhythm;
      value["rhythm_detail"] = obj[1].rhythm_detail;
      lst.push(value);
      rhythmValues[key] = lst;
    }
  });

  return (
    <div>
      <div className="grid grid-row-1 md:grid-cols-2 gap-4">
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <StackedLinePlot title="BP" xData={dates} yData={BPData} />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="Pulse"
            name="Pulse"
            xData={dates}
            yData={yAxisData("pulse")}
            low={40}
            high={100}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="Temperature (F)"
            name="Temperature"
            xData={dates}
            yData={yAxisData("temperature")}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="Resp"
            name="Resp"
            xData={dates}
            yData={yAxisData("resp")}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <StackedLinePlot title="Insulin" xData={dates} yData={InsulinData} />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="SPO2 (%)"
            name="spo2"
            xData={dates}
            yData={yAxisData("ventilator_spo2")}
            low={90}
            high={100}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="Ventilator FIO2 (%)"
            name="fio2"
            xData={dates}
            yData={yAxisData("ventilator_fi02")}
            low={21}
            high={60}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="Pain Scale"
            name="pain"
            xData={dates}
            yData={yAxisData("pain")}
          />
        </div>
      </div>
      <div className="">
        <h3 className="text-lg py-2 px-3">Rhythm</h3>
        <table className="w-full bg-white rounded-lg p-2 shadow overflow-hidden">
          <tbody>
            <tr>
              {["Time", "Rhythm", "Description"].map((heading, i) => (
                <td className="font-bold p-2 bg-gray-300" key={i}>
                  {heading}
                </td>
              ))}
            </tr>
            {Object.entries(rhythmValues).map((obj: any, i: number) => {
              if (obj[1].length > 0) {
                return (
                  <React.Fragment key={i}>
                    <tr>
                      <td
                        colSpan={3}
                        className="font-bold italic text-sm text-center bg-gray-200 p-2 text-gray-800"
                      >
                        {obj[0]}
                      </td>
                    </tr>
                    {obj[1].map((x: any, i: any) => (
                      <tr
                        key={`rhythm_${i}`}
                        className="border-b-2 border-b-gray-100"
                      >
                        <td className="p-2 border-r-2 border-r-gray-100 font-bold">
                          {x.time}
                        </td>
                        <td
                          className={
                            "p-2 border-r-2 border-r-gray-100" +
                            (x.rhythm === 5 ? "" : " text-red-400")
                          }
                        >
                          {x.rhythm === 5 ? "Regular" : "Irregular"}
                        </td>
                        <td className="p-2">{x.rhythm_detail}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              }
            })}
          </tbody>
        </table>
      </div>

      {totalCount > PAGINATION_LIMIT && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={PAGINATION_LIMIT}
            data={{ totalCount }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>
  );
};
