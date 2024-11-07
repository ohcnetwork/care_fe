import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { meanArterialPressure } from "@/components/Common/BloodPressureFormField";
import PageTitle from "@/components/Common/PageTitle";
import Pagination from "@/components/Common/Pagination";
import { PainDiagrams } from "@/components/Facility/Consultations/PainDiagrams";
import { LinePlot } from "@/components/Facility/Consultations/components/LinePlot";
import { StackedLinePlot } from "@/components/Facility/Consultations/components/StackedLinePlot";
import { PrimaryParametersPlotFields } from "@/components/Facility/models";

import { PAGINATION_LIMIT } from "@/common/constants";

import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

interface PrimaryParametersPlotProps {
  facilityId: string;
  patientId: string;
  consultationId: string;
}

export const PrimaryParametersPlot = ({
  consultationId,
}: PrimaryParametersPlotProps) => {
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDailyRounds = async (
      currentPage: number,
      consultationId: string,
    ) => {
      const { res, data } = await request(routes.dailyRoundsAnalyse, {
        body: {
          page: currentPage,
          fields: PrimaryParametersPlotFields,
        },
        pathParams: {
          consultationId,
        },
      });
      if (res && res.ok && data) {
        setResults(data.results);
        setTotalCount(data.count);
      }
    };

    fetchDailyRounds(currentPage, consultationId);
  }, [consultationId, currentPage]);

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
        .map((p: any) => p.bp?.diastolic)
        .reverse(),
    },
    {
      name: "systolic",
      data: Object.values(results)
        .map((p: any) => p.bp?.systolic)
        .reverse(),
    },
    {
      name: "mean",
      data: Object.values(results)
        .map((p: any) => meanArterialPressure(p.bp))
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
        key,
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
      <div className="grid gap-4 md:grid-cols-2" id="vital-section">
        <div className="m-2 overflow-x-auto rounded-lg border bg-white p-4 shadow md:w-full">
          <StackedLinePlot title="BP" xData={dates} yData={BPData} />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white p-4 shadow md:w-full">
          <LinePlot
            title="Pulse"
            name="Pulse"
            xData={dates}
            yData={yAxisData("pulse")}
            low={40}
            high={100}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white p-4 shadow md:w-full">
          <LinePlot
            title="Temperature (F)"
            name="Temperature"
            xData={dates}
            yData={yAxisData("temperature")}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white p-4 shadow md:w-full">
          <LinePlot
            title="Resp"
            name="Resp"
            xData={dates}
            yData={yAxisData("resp")}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white p-4 shadow md:w-full">
          <StackedLinePlot title="Insulin" xData={dates} yData={InsulinData} />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white p-4 shadow md:w-full">
          <LinePlot
            title="SPO2 (%)"
            name="spo2"
            xData={dates}
            yData={yAxisData("ventilator_spo2")}
            low={90}
            high={100}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white p-4 shadow md:w-full">
          <LinePlot
            title="Ventilator FIO2 (%)"
            name="fio2"
            xData={dates}
            yData={yAxisData("ventilator_fio2")}
            low={21}
            high={60}
          />
        </div>
        <div className="m-2 overflow-x-auto rounded-lg border bg-white p-4 shadow md:w-full">
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
                            className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-secondary-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${
                                rhythmDetails.rhythm === 5
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {rhythmDetails.rhythm === 5 ? (
                                <CareIcon
                                  icon="l-check-circle"
                                  className="text-xl"
                                />
                              ) : (
                                <CareIcon
                                  icon="l-times-circle"
                                  className="text-xl"
                                />
                              )}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p
                                className={`text-sm ${
                                  rhythmDetails.rhythm === 5
                                    ? "text-green-500"
                                    : "text-red-500"
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
                            <div className="whitespace-nowrap text-right text-sm text-secondary-500">
                              <p>
                                {rhythmDetails.time}, {obj[0]}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )),
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div>
        <PageTitle title="Pain Scale" hideBack={true} breadcrumbs={false} />
        <PainDiagrams dailyRound={results} />
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
