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

  const EYE_OPEN_SCALE = [
    { value: 4, text: "Spontaneous" },
    { value: 3, text: "To Speech" },
    { value: 2, text: "Pain" },
    { value: 1, text: "None" },
  ];

  const VERBAL_RESPONSE_SCALE = [
    { value: 5, text: "Oriented/Coos/Babbles" },
    { value: 4, text: "Confused/Irritable" },
    { value: 3, text: "Inappropriate words/Cry to Pain" },
    { value: 2, text: "Incomprehensible words/Moans to pain" },
    { value: 1, text: "None" },
  ];

  const MOTOR_RESPONSE_SCALE = [
    { value: 6, text: "Obeying commands" },
    { value: 5, text: "Moves to localised pain" },
    { value: 4, text: "Flexion withdrawal from pain" },
    { value: 3, text: "Abnormal Flexion(decorticate)" },
    { value: 2, text: "Abnormal Extension(decerebrate)" },
    { value: 1, text: "No Response" },
  ];
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
