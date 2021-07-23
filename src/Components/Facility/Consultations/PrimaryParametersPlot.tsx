import { navigate } from "raviger";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import { StackedLinePlot } from "./components/StackedLinePlot";

export const PrimaryParametersPlot = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            offset,
            fields: [
              "bp",
              "pulse",
              "temperature",
              "resp",
              "blood_sugar_level",
              "insulin_intake_frequency",
              "insulin_intake_dose",
              "spo2",
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
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, offset]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [consultationId]
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
            yData={yAxisData("spo2")}
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
      </div>
      <div className="py-2 px-3">
        <h3 className="text-lg">Rhythm</h3>
        {Object.entries(rhythmValues).map((obj: any) => {
          if (obj[1].length > 0) {
            return (
              <div className="px-3 text-sm">
                <h4 className="text-base my-3">{obj[0]}</h4>
                <div className="grid grid-cols-6">
                  {obj[1].map((item: any) => {
                    return (
                      <div className="border-2 border-gray-800 text-center">
                        <div className="py-3 px-2 border-b-2 border-gray-800">
                          {item["time"]}
                        </div>
                        <div className="py-3 px-2">
                          {item["rhythm"] === 5 ? "Regular" : "Ir regular"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        })}
      </div>

      <div className="pt-4 px-4 mx-2 my-2 bg-white border rounded-lg shadow">
        <h3 className="text-lg">Rhythm description</h3>
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
  );
};
