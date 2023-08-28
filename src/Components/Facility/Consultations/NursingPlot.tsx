import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import {
  NURSING_CARE_FIELDS,
  PAGINATION_LIMIT,
} from "../../../Common/constants";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import Pagination from "../../Common/Pagination";
import { formatDateTime } from "../../../Utils/utils";

export const NursingPlot = (props: any) => {
  const { consultationId } = props;
  const dispatch: any = useDispatch();
  const [results, setResults] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            page: currentPage,
            fields: ["nursing"],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res?.data) {
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
      })
    )
    .reduce((accumulator, value) => accumulator.concat(value), []);

  const filterEmpty = (field: any) => {
    const filtered = dataToDisplay.filter(
      (i: any) => i.procedure === field.text
    );
    return filtered.length > 0;
  };

  const areFieldsEmpty = () => {
    let emptyFieldCount = 0;
    for (const field of NURSING_CARE_FIELDS) {
      if (!filterEmpty(field)) emptyFieldCount++;
    }
    if (emptyFieldCount === NURSING_CARE_FIELDS.length) return true;
    else return false;
  };

  return (
    <div>
      <div className="">
        <div>
          <div className="flex flex-row overflow-x-scroll">
            {areFieldsEmpty() && (
              <div className="mt-1 w-full rounded-lg border bg-white p-4 shadow">
                <div className="flex items-center justify-center text-2xl font-bold text-gray-500">
                  No data available
                </div>
              </div>
            )}
            {NURSING_CARE_FIELDS.map(
              (f: any) =>
                filterEmpty(f) && (
                  <div key={f.desc} className="m-2 w-3/4">
                    <div className="sticky top-0 z-10  rounded pt-2">
                      <div className="mx-2 flex items-center justify-between rounded border bg-gray-200 p-4">
                        <h3 className="flex h-8 items-center text-sm">
                          {f.desc}
                        </h3>
                      </div>
                    </div>
                    <div className=" m-2">
                      {dataToDisplay
                        .filter((i: any) => i.procedure === f.text)
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
                )
            )}
          </div>
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
