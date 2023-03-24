import { useState, useEffect } from "react";
import { make as CriticalCare__PainViewer } from "../../CriticalCareRecording/Pain/CriticalCare__PainViewer.gen";
import { formatDate } from "../../../Utils/utils";

export const PainDiagrams = (props: any) => {
  const { fetchData, consultationId } = props;
  const [results, setResults] = useState({});
  const [selectedData, setSelectedData] = useState<any>({
    data: null,
    id: "",
  });

  useEffect(() => {
    if (fetchData) {
      const keys = Object.keys(fetchData || {}).filter(
        (key) => fetchData[key].pain_scale_enhanced.length
      );
      const filterData: any = {};
      keys.forEach((key) => (filterData[key] = fetchData[key]));
      setResults(filterData);
    }
  }, [fetchData]);

  useEffect(() => {
    if (Object.keys(results).length > 0)
      setSelectedDateData(results, Object.keys(results)[0]);
  }, [results]);

  const setSelectedDateData = (data: any, key: any) => {
    setSelectedData({
      data: data[key]?.["pain_scale_enhanced"],
      id: data[key]?.["id"],
    });
  };

  const dates: any = [];
  if (Object.keys(results).length > 0) {
    dates.push(...Object.keys(results));
  }

  const dropdown = (dates: Array<any>) => {
    return dates && dates.length > 0 ? (
      <div className="flex mx-auto flex-wrap">
        <div className="p-2">Choose Date and Time</div>
        <select
          title="date"
          className="pl-3 pr-8 py-2 text-slate-600 relative bg-white rounded border-gray-200 shadow outline-none focus:outline-none  focus:ring-gray-300 focus:border-gray-300 focus:ring-1"
          onChange={(e) => {
            setSelectedDateData(results, e.target.value);
          }}
        >
          {dates.map((key) => {
            return (
              <option key={key} value={key}>
                {formatDate(key)}
              </option>
            );
          })}
        </select>
      </div>
    ) : (
      <div>
        <select
          title="date"
          className="border-2 border-gray-400 pl-3 pr-8 py-2"
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
      {selectedData.data ? (
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
