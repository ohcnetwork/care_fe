import { useEffect, useState } from "react";
import routes from "../../../Redux/api";
import request from "../../../Utils/request/request";
import {
  NURSING_CARE_PROCEDURES,
  PAGINATION_LIMIT,
} from "../../../Common/constants";

import Pagination from "../../Common/Pagination";
import { formatDateTime } from "../../../Utils/utils";
import { useTranslation } from "react-i18next";
import { NursingPlotFields } from "../models";

export const NursingPlot = ({ consultationId }: any) => {
  const { t } = useTranslation();
  const [results, setResults] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDailyRounds = async (
      currentPage: number,
      consultationId: string,
    ) => {
      const { res, data } = await request(routes.dailyRoundsAnalyse, {
        body: { page: currentPage, fields: NursingPlotFields },
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

  const data = Object.entries(results).map((key: any) => {
    return {
      date: formatDateTime(key[0]),
      nursing: key[1]["nursing"],
    };
  });

  const dataToDisplay = data
    .map((x) =>
      x.nursing.map((f: any) => {
        f["date"] = x.date;
        return f;
      }),
    )
    .reduce((accumulator, value) => accumulator.concat(value), []);

  const filterEmpty = (field: (typeof NURSING_CARE_PROCEDURES)[number]) => {
    const filtered = dataToDisplay.filter((i: any) => i.procedure === field);
    return filtered.length > 0;
  };

  const areFieldsEmpty = () => {
    let emptyFieldCount = 0;
    for (const field of NURSING_CARE_PROCEDURES) {
      if (!filterEmpty(field)) emptyFieldCount++;
    }
    if (emptyFieldCount === NURSING_CARE_PROCEDURES.length) return true;
    else return false;
  };

  const groupedByDate: any = {};
  dataToDisplay.forEach((item: any) => {
    if (!groupedByDate[item.date]) {
      groupedByDate[item.date] = [];
    }
    groupedByDate[item.date].push(item);
  });

  return (
    <div>
      <div className="">
        <div>
          <div className="flex flex-row overflow-x-scroll">
            {areFieldsEmpty() && (
              <div className="mt-1 w-full rounded-lg border bg-white p-4 shadow">
                <div className="flex items-center justify-center text-2xl font-bold text-secondary-500">
                  {t("no_data_found")}
                </div>
              </div>
            )}
            {
              <div className="pb-8 pt-4">
                <div className="item m-2 flex w-full place-items-center overflow-hidden overflow-x-auto rounded-lg border border-black shadow md:w-fit">
                  <table className="border-collapse overflow-hidden rounded-lg border bg-secondary-100">
                    <thead className="bg-white shadow">
                      <tr>
                        <th className="w-48 border-b-2 border-r-2 border-black">
                          Procedure
                        </th>

                        {Object.keys(groupedByDate).map((date, index) => (
                          <th
                            key={index}
                            className="w-48 border border-b-2 border-secondary-500 border-b-black p-1 text-sm font-semibold"
                          >
                            {date}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="bg-secondary-200">
                      {NURSING_CARE_PROCEDURES.filter((f) =>
                        dataToDisplay.some((i: any) => i.procedure === f),
                      ).map((f) => (
                        <tr key={f}>
                          <td className="w-48 border border-r-2 border-secondary-500 border-r-black bg-white p-2 font-bold">
                            {t(`NURSING_CARE_PROCEDURE__${f}`)}
                          </td>

                          {Object.keys(groupedByDate).map((date, index) => {
                            const matchingCare = groupedByDate[date].find(
                              (i: any) => i.procedure === f,
                            );

                            return (
                              <td
                                key={index}
                                className="w-48 border border-secondary-500 bg-secondary-100 p-2 text-center font-medium"
                              >
                                {matchingCare ? matchingCare.description : "-"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      {!areFieldsEmpty() && totalCount > PAGINATION_LIMIT && (
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
