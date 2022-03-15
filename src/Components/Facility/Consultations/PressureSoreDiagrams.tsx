import moment from "moment";
import { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { make as CriticalCarePressureScoreViewer } from "../../CriticalCareRecording/PressureSore/CriticalCare__PressureSoreViewer.gen";

export const PressureSoreDiagrams = (props: any) => {
  const { consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [selectedData, setData] = useState<any>({
    data: [],
    id: "",
  });

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            page: 1,
            fields: ["pressure_sore"],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          const keys = Object.keys(res.data.results || {}).filter(
            (key) => res.data.results[key].pressure_sore.length
          );
          const data: any = {};
          keys.forEach((key) => (data[key] = res.data.results[key]));

          setResults(data);
          if (keys.length > 0) {
            setSelectedDateData(data, keys[0]);
          }
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch]
  );

  useEffect(() => {
    if (Object.keys(results).length > 0)
      setSelectedDateData(results, Object.keys(results)[0]);
  }, [results]);

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [consultationId]
  );

  useEffect(() => {
    if (Object.keys(results).length > 0)
      setSelectedDateData(results, Object.keys(results)[0]);
  }, [results]);

  const setSelectedDateData = (results: any, key: any) => {
    setData({
      data: results[key]?.["pressure_sore"],
      id: results[key]?.["id"],
    });
  };

  let dates: any = [];
  if (Object.keys(results).length > 0) {
    dates = Object.keys(results);
  }

  const dropdown = (dates: Array<any>) => {
    return dates && dates.length > 0 ? (
      <div className="flex mx-auto">
        <div className="p-2">Choose Date and Time</div>
        <select
          title="date"
          className="border-2 border-gray-800 p-2"
          onChange={(e) => {
            setSelectedDateData(results, e.target.value);
          }}
        >
          {dates.map((key) => {
            return (
              <option key={key} value={key}>
                {moment(key).format("LLL")}
              </option>
            );
          })}
        </select>
      </div>
    ) : (
      <div>
        <select
          title="date"
          className="border-2 border-gray-400 p-2"
          disabled={true}
        >
          <option>No Data Found</option>
        </select>
      </div>
    );
  };

  return (
    <div>
      {dates && dropdown(dates)}
      {!isLoading && selectedData.data && (
        <CriticalCarePressureScoreViewer
          pressureSoreParameter={selectedData.data}
          id={selectedData.id}
          consultationId={consultationId}
        />
      )}
    </div>
  );
};
