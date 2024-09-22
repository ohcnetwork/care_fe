import { useEffect, useState } from "react";
import routes from "../../../Redux/api";
import request from "../../../Utils/request/request";
import { formatDateTime } from "../../../Utils/utils";
import PainChart from "../../LogUpdate/components/PainChart";
import { PainDiagramsFields } from "../models";

export const PainDiagrams = (props: any) => {
  const { consultationId } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [selectedData, setData] = useState<any>({
    data: [],
    id: "",
  });

  useEffect(() => {
    const fetchDailyRounds = async (consultationId: string) => {
      setIsLoading(true);
      const { res, data: dailyRound } = await request(
        routes.dailyRoundsAnalyse,
        {
          body: { fields: PainDiagramsFields },
          pathParams: {
            consultationId,
          },
        },
      );
      if (res && res.ok && dailyRound?.results) {
        const keys = Object.keys(dailyRound.results || {}).filter(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          (key) => dailyRound.results[key].pain_scale_enhanced.length,
        );
        const data: any = {};
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        keys.forEach((key) => (data[key] = dailyRound.results[key]));

        setResults(data);
        if (keys.length > 0) {
          setSelectedDateData(data, keys[0]);
        }
      }
      setIsLoading(false);
    };

    fetchDailyRounds(consultationId);
  }, [consultationId]);

  useEffect(() => {
    if (Object.keys(results).length > 0)
      setSelectedDateData(results, Object.keys(results)[0]);
  }, [results]);

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
          className="relative rounded border-secondary-200 bg-white py-2 pl-3 pr-8 text-slate-600 shadow outline-none focus:border-secondary-300 focus:outline-none focus:ring-1 focus:ring-secondary-300"
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
          className="border-2 border-secondary-400 py-2 pl-3 pr-8"
          disabled={true}
        >
          <option>No Data Found</option>
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {dates && dropdown(dates)}
      {!isLoading && selectedData.data ? (
        <PainChart pain={selectedData.data} />
      ) : (
        <div className="h-screen" />
      )}
    </div>
  );
};
