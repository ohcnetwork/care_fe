import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Pagination from "@/components/Common/Pagination";
import { NursingPlotFields } from "@/components/Facility/models";

import { NURSING_CARE_PROCEDURES, PAGINATION_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

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
            {NURSING_CARE_PROCEDURES.map(
              (f) =>
                filterEmpty(f) && (
                  <div key={f} className="m-2 w-3/4">
                    <div className="sticky top-0 z-10 rounded pt-2">
                      <div className="mx-2 flex items-center justify-between rounded border bg-secondary-200 p-4">
                        <h3 className="flex h-8 items-center text-sm">
                          {t(`NURSING_CARE_PROCEDURE__${f}`)}
                        </h3>
                      </div>
                    </div>
                    <div className="m-2">
                      {dataToDisplay
                        .filter((i: any) => i.procedure === f)
                        .map((care: any, index: number) => (
                          <div
                            key={index}
                            className="my-2 w-full divide-y rounded-lg border bg-white p-4 shadow"
                          >
                            <div className="text-xs font-semibold">
                              {care.date}
                            </div>
                            <div className="py-2 text-sm">
                              {care.description}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ),
            )}
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
