import { useEffect, useState } from "react";

import Pagination from "@/components/Common/Pagination";
import {
  PressureSoreDiagramsFields,
  PressureSoreDiagramsRes,
} from "@/components/Facility/models";
import PressureSore from "@/components/LogUpdate/Sections/PressureSore/PressureSore";

import { PAGINATION_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

export const PressureSoreDiagrams = (props: any) => {
  const { consultationId } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [selectedData, setData] = useState<any>({
    data: [],
    id: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, _setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDailyRounds = async (
      currentPage: number,
      consultationId: string,
    ) => {
      setIsLoading(true);
      const { res, data: dailyRounds } = await request(
        routes.dailyRoundsAnalyse,
        {
          body: { page: currentPage, fields: PressureSoreDiagramsFields },
          pathParams: {
            consultationId,
          },
        },
      );
      if (res && res.ok && dailyRounds) {
        const keys = Object.keys(dailyRounds.results || {}).filter(
          (key) =>
            (dailyRounds.results[key] as PressureSoreDiagramsRes).pressure_sore
              .length,
        );
        const data: any = {};
        keys.forEach((key) => (data[key] = dailyRounds.results[key]));

        setResults(data);
        if (keys.length > 0) {
          setSelectedDateData(data, keys[0]);
        }
      }
      setIsLoading(false);
    };

    fetchDailyRounds(currentPage, consultationId);
  }, [consultationId, currentPage]);

  useEffect(() => {
    if (Object.keys(results).length > 0)
      setSelectedDateData(results, Object.keys(results)[0]);
  }, [results]);

  const handlePagination = (page: number, _limit: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (Object.keys(results).length > 0)
      setSelectedDateData(results, Object.keys(results)[0]);
  }, [results]);

  const setSelectedDateData = (results: any, key: any) => {
    setData({
      data: results[key]?.["pressure_sore"],
      id: results[key]?.["id"],
    });
  };

  let dates: any = [];
  if (Object.keys(results).length > 0) {
    dates = Object.keys(results);
  }

  const dropdown = (dates: Array<any>) => {
    return dates && dates.length > 0 ? (
      <div className="mx-auto flex flex-wrap">
        <div className="p-2">Choose Date and Time</div>
        <select
          title="date"
          className="relative rounded border-secondary-200 bg-white py-2 pl-3 pr-8 text-slate-600 shadow outline-none focus:border-secondary-300 focus:outline-none focus:ring-1 focus:ring-secondary-300"
          onChange={(e) => {
            setSelectedDateData(results, e.target.value);
          }}
        >
          {dates.map((key) => {
            return (
              <option key={key} value={key}>
                {formatDateTime(key)}
              </option>
            );
          })}
        </select>
      </div>
    ) : (
      <div>
        <select
          title="date"
          className="border-2 border-secondary-400 py-2 pl-3 pr-8"
          disabled={true}
        >
          <option>No Data Found</option>
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {dates && dropdown(dates)}
      {!isLoading && selectedData.data ? (
        <PressureSore
          log={{ pressure_sore: selectedData.data }}
          readonly
          onChange={() => {
            //
          }}
        />
      ) : (
        <div className="h-screen" />
      )}
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
