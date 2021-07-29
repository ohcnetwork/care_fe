import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { NURSING_CARE_FIELDS } from "../../../Common/constants";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import Pagination from "../../Common/Pagination";

export const NursingPlot = (props: any) => {
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

  const handlePagination = (page: number, limit: number) => {
    setCurrentPage(page);
  };

  const data = Object.entries(results).map((key: any) => {
    return {
      date: moment(key[0]).format("LLL"),
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
      <div className="grid md:grid-cols-full gap-4">
        <div>
          <div className="space-y-2">
            {NURSING_CARE_FIELDS.map(
              (f: any) =>
                filterEmpty(f) && (
                  <div
                    key={f.desc}
                    className="p-4 bg-white border rounded-lg shadow"
                  >
                    <div className="text-xl font-semibold">{f.desc}</div>
                    <div className="space-y-2">
                      {dataToDisplay
                        .filter((i: any) => i.procedure === f.text)
                        .map((care: any, index: number) => (
                          <div key={index}>
                            <div className="text-sm font-semibold">{`- ${care.date}`}</div>
                            <div className="text-cool-gray-800 pl-2">
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
      <div className="mt-4 flex w-full justify-center">
        <Pagination
          cPage={currentPage}
          defaultPerPage={36}
          data={{ totalCount }}
          onChange={handlePagination}
        />
      </div>
    </div>
  );
};
