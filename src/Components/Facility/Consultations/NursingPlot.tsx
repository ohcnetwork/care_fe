import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { NURSING_CARE_FIELDS } from "../../../Common/constants";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";

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

  const handlePagination = (page: number, limit: number) => {
    setCurrentPage(page);
  };

  const data = Object.entries(results).map((key: any) => {
    return {
      date: moment(key[0]).format("lll"),
      nursing: key[1]["nursing"],
    };
  });

  let dataToDisplay = data
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

  return (
    <div>
      <div className="">
        <div>
          <div className="flex flex-row overflow-x-scroll">
            {NURSING_CARE_FIELDS.map(
              (f: any) =>
                filterEmpty(f) && (
                  <div key={f.desc} className="m-2 w-3/4">
                    <div className="sticky top-0 pt-2  rounded z-10">
                      <div className="flex justify-between p-4 mx-2 rounded bg-gray-200 border items-center">
                        <h3 className="text-sm flex items-center h-8">
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
                            className="w-full my-2 p-4 divide-y bg-white border rounded-lg shadow"
                          >
                            <div className="text-xs font-semibold">
                              {care.date}
                            </div>
                            <div className="text-sm py-2">
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
