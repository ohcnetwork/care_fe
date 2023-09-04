import { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { make as CriticalCare__PainViewer } from "../../CriticalCareRecording/Pain/CriticalCare__PainViewer.bs";
import { formatDateTime } from "../../../Utils/utils";

export const PainDiagrams = (props: any) => {
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
            fields: ["pain_scale_enhanced"],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          const keys = Object.keys(res.data.results || {}).filter(
            (key) => res.data.results[key].pain_scale_enhanced.length
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
      data: results[key]?.["pain_scale_enhanced"],
      id: results[key]?.["id"],
    });
  };

  let dates: any = [];
  if (Object.keys(results).length > 0) {
    dates = Object.keys(results);
  }

  const dropdown = (dates: Array<any>) => {
    return dates && dates.length > 0 ? (
      <div className="mx-auto flex flex-wrap">
        <div className="p-2">Choose Date and Time</div>
        <select
          title="date"
          className="relative rounded border-gray-200 bg-white py-2 pl-3 pr-8 text-slate-600 shadow outline-none focus:border-gray-300  focus:outline-none focus:ring-1 focus:ring-gray-300"
          onChange={(e) => {
            setSelectedDateData(results, e.target.value);
          }}
        >
          {dates.map((key) => {
            return (
              <option key={key} value={key}>
                {formatDateTime(key)}
              </option>
            );
          })}
        </select>
      </div>
    ) : (
      <div>
        <select
          title="date"
          className="border-2 border-gray-400 py-2 pl-3 pr-8"
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
      {!isLoading && selectedData.data ? (
        <CriticalCare__PainViewer
          painParameter={selectedData.data}
          id={selectedData.id}
          consultationId={consultationId}
        />
      ) : (
        <div className="h-screen" />
      )}
    </div>
  );
};
