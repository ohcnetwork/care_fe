import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";
import ResponsiveMedicineTable from "../../Common/components/ResponsiveMedicineTables";

export const MedicineTables = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
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
        setIsLoading(false);
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

  const areFieldsEmpty = () => {
    let emptyFieldCount = 0;
    Object.keys(results).forEach((k: any) => {
      if (Object.keys(results[k].medication_given).length === 0) {
        emptyFieldCount++;
      }
    });
    if (emptyFieldCount === Object.keys(results).length) return true;
    else return false;
  };

  const noDataFound = Object.keys(results).length === 0 || areFieldsEmpty();

  return (
    <div>
      {results && (
        <div>
          <div className="mt-4 text-lg font-bold">Consultation Updates</div>
          {noDataFound && (
            <div className="text-md h-full text-center mt-5 text-gray-600 text-semibold bg-white rounded-lg shadow py-4 px-2">
              No Consultation Updates Found
            </div>
          )}
          {Object.keys(results).map((k: any, indx: number) => (
            <div key={indx}>
              {Object.keys(results[k].medication_given).length !== 0 && (
                <div className="grid gap-4">
                  <div className="mt-4">
                    <div className="text-md font-semibold leading-relaxed text-gray-900 mb-2">
                      {moment(k).format("LLL")}
                    </div>
                    <div className="flex flex-col">
                      <div className="-my-2 py-2 overflow-x-auto sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                        <div className="align-middle inline-block min-w-full shadow overflow-hidden sm:rounded-lg border-b border-gray-200">
                          <ResponsiveMedicineTable
                            theads={[
                              "Medicine",
                              "Route",
                              "Frequency",
                              "Dosage",
                              "Days",
                              "Notes",
                            ]}
                            list={results[k].medication_given}
                            objectKeys={[
                              "medicine",
                              "route",
                              "dosage",
                              "dosage_new",
                              "days",
                              "notes",
                            ]}
                            fieldsToDisplay={[2, 3]}
                          />
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
