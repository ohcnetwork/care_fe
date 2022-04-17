import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";

export const ABGPlots = (props: any) => {
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
              "ph",
              "pco2",
              "po2",
              "hco3",
              "base_excess",
              "lactate",
              "sodium",
              "potassium",
              "ventilator_fi02",
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
    [currentPage]
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

  return (
    <div>
      <div className="grid grid-row-1 md:grid-cols-2 gap-4">
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="PH"
            name="PH"
            xData={dates}
            yData={yAxisData("ph")}
            low={7.35}
            high={7.45}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="PCO2 (mm Hg)"
            name="PCO2"
            xData={dates}
            yData={yAxisData("pco2")}
            low={35}
            high={45}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="PO2 (mm Hg)"
            name="PO2"
            xData={dates}
            yData={yAxisData("po2")}
            low={50}
            high={200}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="HCO3  (mmol/L)"
            name="HCO3"
            xData={dates}
            yData={yAxisData("hco3")}
            low={22}
            high={26}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="Base Excess  (mmol/L)"
            name="Base Excess"
            xData={dates}
            yData={yAxisData("base_excess")}
            low={-2}
            high={2}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
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
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="Sodium  (mmol/L)"
            name="Sodium"
            xData={dates}
            yData={yAxisData("sodium")}
            low={135}
            high={145}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="Potassium  (mmol/L)"
            name="Potassium"
            xData={dates}
            yData={yAxisData("potassium")}
            low={3.5}
            high={5.5}
          />
        </div>
        <div className="pt-4 px-4 bg-white border rounded-lg shadow">
          <LinePlot
            title="FIO2(Ventilator)(%)"
            name="fio2"
            xData={dates}
            yData={yAxisData("ventilator_fi02")}
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
