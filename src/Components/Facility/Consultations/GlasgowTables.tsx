import { result } from "lodash";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import {
  EYE_OPEN_SCALE,
  VERBAL_RESPONSE_SCALE,
  MOTOR_RESPONSE_SCALE,
} from "../../../Common/constants";

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

  return (
    <div className="mt-2">
      <div className="mb-6">
        <div className="flex flex-row shadow overflow-hidden sm:rounded-lg divide-y divide-cool-gray-200 mb-4 w-max-content max-w-full">
          <div className="flex flex-col ">
            <div className="px-2 py-12 bg-cool-gray-50 text-center text-sm leading-4 font-medium text-cool-gray-500 uppercase tracking-wider">
              Time
            </div>
            <div className="px-2 py-4 bg-cool-gray-50 text-center text-sm leading-5 font-medium text-cool-gray-500 uppercase tracking-wider">
              Eye
            </div>
            <div className="px-2 py-4 bg-cool-gray-50 text-center text-sm leading-5 font-medium text-cool-gray-500 uppercase tracking-wider">
              Verbal
            </div>
            <div className="px-2 py-4 bg-cool-gray-50 text-center text-sm leading-5 font-medium text-cool-gray-500 uppercase tracking-wider">
              Motor
            </div>
            <div className="px-2 py-4 bg-cool-gray-50 text-center text-sm leading-5 font-medium text-cool-gray-500 uppercase tracking-wider">
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
                  className="flex flex-col divide-x divide-cool-gray-200"
                >
                  <div className="px-6 py-3 bg-cool-gray-50 text-center text-xs leading-4 font-medium text-cool-gray-500">
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
      <div className="mb-6">
        <div className="text-xl font-semibold my-2">Scale Description</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="px-4 py-2 bg-white border rounded-lg shadow">
            <div className="text-xl font-semibold mb-2">Eye Open</div>
            <div>
              {EYE_OPEN_SCALE.map((x: any) => (
                <div
                  key={`eye_${x.value}`}
                  className="text-cool-gray-800 pl-2 leading-relaxed"
                >
                  <span className="text-sm font-semibold">{x.value}</span> -{" "}
                  {x.text}
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-2 bg-white border rounded-lg shadow">
            <div className="text-xl font-semibold mb-2">Verbal Response</div>
            <div>
              {VERBAL_RESPONSE_SCALE.map((x: any) => (
                <div
                  key={`verbal_${x.value}`}
                  className="text-cool-gray-800 pl-2 leading-relaxed"
                >
                  <span className="text-sm font-semibold">{x.value}</span> -{" "}
                  {x.text}
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 py-2 bg-white border rounded-lg shadow">
            <div className="text-xl font-semibold mb-2">Motor Response</div>
            <div>
              {MOTOR_RESPONSE_SCALE.map((x: any) => (
                <div
                  key={`motor_${x.value}`}
                  className="text-cool-gray-800 pl-2 leading-relaxed"
                >
                  <span className="text-sm font-semibold">{x.value}</span> -{" "}
                  {x.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
