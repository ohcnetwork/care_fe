import { useEffect, useState } from "react";
import routes from "../../../Redux/api";
import request from "../../../Utils/request/request";
import { LinePlot } from "./components/LinePlot";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";
import { formatDateTime } from "../../../Utils/utils";

export const DialysisPlots = (props: any) => {
  const { consultationId } = props;
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDailyRounds = async (currentPage: number) => {
      const { res, data } = await request(routes.dailyRoundsAnalyse, {
        body: {
          page: currentPage,
          fields: ["dialysis_fluid_balance", "dialysis_net_balance"],
        },
        pathParams: {
          consultationId,
        },
      });
      if (res?.ok && data) {
        setTotalCount(data.count);
        setResults(data.results);
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
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Dialysis Fluid Balance"
            name="Fluid Balance"
            xData={dates}
            yData={yAxisData("dialysis_fluid_balance")}
          />
        </div>

        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Dialysis Net Balance"
            name="Net Balance"
            xData={dates}
            yData={yAxisData("dialysis_net_balance")}
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
