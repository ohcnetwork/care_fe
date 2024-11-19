import { useEffect, useState } from "react";

import Pagination from "@/components/Common/Pagination";
import { LinePlot } from "@/components/Facility/Consultations/components/LinePlot";
import { ABGPlotsFields } from "@/components/Facility/models";

import { PAGINATION_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

export const ABGPlots = (props: any) => {
  const { consultationId } = props;
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDailyRounds = async (currentPage: number) => {
      const { res, data } = await request(routes.dailyRoundsAnalyse, {
        body: { page: currentPage, fields: ABGPlotsFields },
        pathParams: {
          consultationId,
        },
      });
      if (res?.ok && data) {
        setResults(data.results);
        setTotalCount(data.count);
      }
    };
    fetchDailyRounds(currentPage);
  }, [currentPage, consultationId]);

  const handlePagination = (page: number, _limit: number) => {
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

  return (
    <div>
      <div className="grid-row-1 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="PH"
            name="PH"
            xData={dates}
            yData={yAxisData("ph")}
            low={7.35}
            high={7.45}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="PCO2 (mm Hg)"
            name="PCO2"
            xData={dates}
            yData={yAxisData("pco2")}
            low={35}
            high={45}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="PO2 (mm Hg)"
            name="PO2"
            xData={dates}
            yData={yAxisData("po2")}
            low={50}
            high={200}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="HCO3  (mmol/L)"
            name="HCO3"
            xData={dates}
            yData={yAxisData("hco3")}
            low={22}
            high={26}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="Base Excess  (mmol/L)"
            name="Base Excess"
            xData={dates}
            yData={yAxisData("base_excess")}
            low={-2}
            high={2}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="Lactate  (mmol/L)"
            name="Lactate"
            xData={dates}
            yData={yAxisData("lactate")}
            max={20}
            low={0}
            high={2}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="Sodium  (mmol/L)"
            name="Sodium"
            xData={dates}
            yData={yAxisData("sodium")}
            low={135}
            high={145}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="Potassium  (mmol/L)"
            name="Potassium"
            xData={dates}
            yData={yAxisData("potassium")}
            low={3.5}
            high={5.5}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="FIO2(Ventilator)(%)"
            name="fio2"
            xData={dates}
            yData={yAxisData("ventilator_fio2")}
            low={21}
            high={60}
          />
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
