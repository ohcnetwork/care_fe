import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import { StackedLinePlot } from "./components/StackedLinePlot";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";
import { formatDateTime } from "../../../Utils/utils";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { PainDiagrams } from "./PainDiagrams";
import PageTitle from "../../Common/PageTitle";
import dayjs from "../../../Utils/dayjs";

interface PrimaryParametersPlotProps {
  facilityId: string;
  patientId: string;
  consultationId: string;
}

export const PrimaryParametersPlot = ({
  consultationId,
}: PrimaryParametersPlotProps) => {
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
    .map((p: string) => formatDateTime(p))
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
      const key: string = dayjs(obj[0]).format("MMMM D, YYYY");
      const lst: Array<any> = Object.prototype.hasOwnProperty.call(
        rhythmValues,
        key
      )
        ? rhythmValues[key]
        : [];
      const value: any = {};
      value["time"] = dayjs(obj[0]).format("h:mm A");
      value["rhythm"] = obj[1].rhythm;
      value["rhythm_detail"] = obj[1].rhythm_detail;
      lst.push(value);
      rhythmValues[key] = lst;
    }
  });

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="m-2 overflow-x-auto rounded-lg border bg-white px-4 pt-4 shadow md:w-full">
          <StackedLinePlot title="BP" xData={dates} yData={BPData} />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white px-4 pt-4 shadow md:w-full">
          <LinePlot
            title="Pulse"
            name="Pulse"
            xData={dates}
            yData={yAxisData("pulse")}
            low={40}
            high={100}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white px-4 pt-4 shadow md:w-full">
          <LinePlot
            title="Temperature (F)"
            name="Temperature"
            xData={dates}
            yData={yAxisData("temperature")}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white px-4 pt-4 shadow md:w-full">
          <LinePlot
            title="Resp"
            name="Resp"
            xData={dates}
            yData={yAxisData("resp")}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white px-4 pt-4 shadow md:w-full">
          <StackedLinePlot title="Insulin" xData={dates} yData={InsulinData} />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white px-4 pt-4 shadow md:w-full">
          <LinePlot
            title="SPO2 (%)"
            name="spo2"
            xData={dates}
            yData={yAxisData("ventilator_spo2")}
            low={90}
            high={100}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white px-4 pt-4 shadow md:w-full">
          <LinePlot
            title="Ventilator FIO2 (%)"
            name="fio2"
            xData={dates}
            yData={yAxisData("ventilator_fi02")}
            low={21}
            high={60}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white px-4 pt-4 shadow md:w-full">
          <h3 className="text-sm">Rhythm</h3>
          {Object.keys(rhythmValues).length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-center">No Rhythm data available.</p>
            </div>
          ) : (
            <div className="m-2 flow-root h-64 overflow-y-scroll">
              <ul role="list" className="-mb-8">
                {Object.entries(rhythmValues).map((obj: any) =>
                  obj[1].map((rhythmDetails: any, rhythmIdx: number) => (
                    <li key={rhythmIdx}>
                      <div className="relative pb-8">
                        {rhythmIdx !== obj[1].length ? (
                          <span
                            className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${
                                rhythmDetails.rhythm === 5
                                  ? " text-green-500 "
                                  : " text-red-500 "
                              }`}
                            >
                              {rhythmDetails.rhythm === 5 ? (
                                <CareIcon className="care-l-check-circle text-xl" />
                              ) : (
                                <CareIcon className="care-l-times-circle text-xl" />
                              )}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p
                                className={`text-sm ${
                                  rhythmDetails.rhythm === 5
                                    ? " text-green-500 "
                                    : " text-red-500 "
                                }`}
                              >
                                <span className="mr-5">
                                  {rhythmDetails.rhythm === 5
                                    ? "Regular"
                                    : "Irregular"}
                                </span>
                                <span>{rhythmDetails.rhythm_detail}</span>
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                              <p>
                                {rhythmDetails.time}, {obj[0]}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div>
        <PageTitle title="Pain Scale" hideBack={true} breadcrumbs={false} />
        <PainDiagrams consultationId={consultationId} />
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
