import { navigate } from "raviger";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import { StackedLinePlot } from "./components/StackedLinePlot";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";

export const PrimaryParametersPlot = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
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
        setIsLoading(false);
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

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
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

  let rhythmValues: any = {};
  Object.entries(results).map((obj: any) => {
    if (obj[1].rhythm && obj[1].rhythm > 0) {
      const key: string = moment(obj[0]).format("LL");
      const lst: Array<any> = rhythmValues.hasOwnProperty(key)
        ? rhythmValues[key]
        : [];
      const value: any = {};
      value["time"] = moment(obj[0]).format("LT");
      value["rhythm"] = obj[1].rhythm;
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
      <div className="py-2 px-3">
        <h3 className="text-lg">Rhythm</h3>
        {Object.entries(rhythmValues).map((obj: any) => {
          if (obj[1].length > 0) {
            return (
              <div>
                <h4 className="text-base my-3">{obj[0]}</h4>
                <div className="flex flex-row shadow overflow-hidden sm:rounded-lg divide-y divide-cool-gray-200 my-4 w-max-content max-w-full">
                  <div className="flex flex-row overflow-x-auto">
                    {obj[1].map((x: any, i: any) => (
                      <div
                        key={`rhythm_${i}`}
                        className="flex flex-col  min-w-max-content divide-x divide-cool-gray-200"
                      >
                        <div className="px-2 border-r py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500">
                          {x.time}
                        </div>
                        <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                          {x.rhythm === 5 ? "Regular" : "Irregular"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>

      <div className="py-2 px-3">
        <h3 className="text-lg">Rhythm description</h3>
        <div className="mt-4 bg-white rounded-lg p-2 shadow">
          {Object.entries(results).map((obj: any) => {
            if (obj[1].rhythm_detail) {
              return (
                <div className="mx-2 my-1">
                  <h4 className="text-sm">- {moment(obj[0]).format("LLL")}</h4>
                  <div className="px-5 text-sm">
                    <div>{obj[1].rhythm_detail}</div>
                  </div>
                </div>
              );
            }
          })}
        </div>
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
