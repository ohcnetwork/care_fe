import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";

export const MedicineTables = (props: any) => {
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
            fields: ["medication_given"],
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

  //

  return (
    <div>
      {results && (
        <div>
          <div className="mt-4 text-lg font-bold">Consultation Updates</div>
          {Object.keys(results).map((k: any, i: number) => (
            <div key={i}>
              {Object.keys(results[k].medication_given).length !== 0 && (
                <div className="grid md:grid-cols-full gap-4">
                  <div className="mt-4">
                    <div className="text-md font-semibold leading-relaxed text-gray-900">
                      {moment(k).format("LLL")}
                    </div>
                    <div className="flex flex-col">
                      <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                        <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
                          <table className="min-w-full">
                            <thead>
                              <tr>
                                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                  Medicine
                                </th>
                                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                  Dosage
                                </th>
                                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                  Days
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {results[k].medication_given.map(
                                (med: any, index: number) => (
                                  <tr className="bg-white" key={index}>
                                    <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">
                                      {med.medicine}
                                    </td>
                                    <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                      {med.dosage}
                                    </td>
                                    <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">
                                      {med.days}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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
