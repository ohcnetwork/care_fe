import { result } from "lodash";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";

export const GlasgowTables = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            offset,
            fields: [
              "glasgow_eye_open",
              "glasgow_verbal_response",
              "glasgow_motor_response",
              "glasgow_total_calculated",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data && res.data.results) {
          setResults(res.data.results);
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, offset]
  );

  useAbortableEffect((status: statusType) => {
    fetchDailyRounds(status);
  }, []);

  let data: any = [];

  Object.entries(results).map((item) => {
    const date = item[0];
    const value: any = item[1];
    console.log(date, value);
    if (
      value.glasgow_eye_open ||
      value.glasgow_verbal_response ||
      value.glasgow_motor_response
    ) {
      data.push({
        date: moment(date).format("LLL"),
        eye: value.glasgow_eye_open || "-",
        verbal: value.glasgow_verbal_response || "-",
        motor: value.glasgow_motor_response || "-",
        total: value.glasgow_total_calculated || "-",
      });
    }
  });
  console.log(results, data);

  return (
    <div className="mt-2">
      <div className="mb-6">
        <div className="flex flex-row shadow overflow-hidden sm:rounded-lg divide-y divide-cool-gray-200 mb-4">
          <div className="flex flex-col min-w-max-content w-50">
            <div className="px-6 py-3 bg-cool-gray-50 text-center text-sm leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
              Time
            </div>
            <div className="px-6 py-4 bg-cool-gray-50 text-center text-sm leading-5 font-medium text-cool-gray-500 uppercase tracking-wider">
              Eye
            </div>
            <div className="px-6 py-4 bg-cool-gray-50 text-center text-sm leading-5 font-medium text-cool-gray-500 uppercase tracking-wider">
              Verbal
            </div>
            <div className="px-6 py-4 bg-cool-gray-50 text-center text-sm leading-5 font-medium text-cool-gray-500 uppercase tracking-wider">
              Motor
            </div>
            <div className="px-6 py-4 bg-cool-gray-50 text-center text-sm leading-5 font-medium text-cool-gray-500 uppercase tracking-wider">
              Total
            </div>
          </div>
          <div
            style={{ direction: "rtl" }}
            className="flex flex-row overflow-x-auto"
          >
            {data.map((x: any, i: any) => {
              return (
                <div
                  key={`glascow_${i}`}
                  className="flex flex-col w-1/6 min-w-max-content divide-x divide-cool-gray-200"
                >
                  <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
                    {x.date}
                  </div>
                  <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                    {x.eye}
                  </div>
                  <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                    {x.verbal}
                  </div>
                  <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 text-cool-gray-500">
                    {x.motor}
                  </div>
                  <div className="px-6 py-4 bg-white text-center whitespace-no-wrap text-sm leading-5 font-semibold text-cool-gray-700 border-t-2 border-cool-gray-500">
                    {x.total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
