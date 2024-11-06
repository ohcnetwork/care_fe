import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import PainChart from "@/components/LogUpdate/components/PainChart";

import { formatDateTime } from "@/Utils/utils";

export const PainDiagrams = (props: any) => {
  const { dailyRound } = props;
  const [results, setResults] = useState({});
  const [selectedData, setData] = useState({
    data: [],
    id: "",
  });
  const { t } = useTranslation();

  useEffect(() => {
    const filterDailyRounds = () => {
      if (dailyRound) {
        const keys = Object.keys(dailyRound || {}).filter(
          (key) => dailyRound[key].pain_scale_enhanced.length,
        );
        const data: any = {};
        keys.forEach(
          (key) =>
            (data[key] = Object.assign(
              {},
              { pain_scale_enhanced: dailyRound[key].pain_scale_enhanced },
            )),
        );

        setResults(data);
        if (keys.length > 0) {
          setSelectedDateData(data, keys[0]);
        }
      }
    };

    filterDailyRounds();
  }, [dailyRound]);

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
        <div className="p-2">{t("choose_date_time")}</div>
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
          <option>{t("no_data_found")}</option>
        </select>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {dates && dropdown(dates)}
      {selectedData.data ? (
        <PainChart pain={selectedData.data} />
      ) : (
        <div className="h-screen" />
      )}
    </div>
  );
};
