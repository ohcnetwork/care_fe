import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { anteriorParts, posteriorParts } from "./PressureSoreConstants";

export const PressureSoreDiagrams = (props: any) => {
  const { consultationId } = props;
  const dispatch: any = useDispatch();
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({});
  const [selectedData, setData] = useState<any>({
    region: [],
    scale: [],
  });

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            offset,
            fields: ["pressure_sore"],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          console.log("Data is ", res.data);
          setResults(res.data);
          let keys = Object.keys(res.data);
          let obj = res.data[keys[0]].pressure_sore;
          let regions: Array<string> = [],
            scales: Array<Number> = [];
          obj.forEach((x: any) => {
            regions.push(x.region);
            scales.push(x.scale);
          });
          setData({
            region: regions,
            scale: scales,
          });
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, offset]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [consultationId]
  );

  const dates = Object.keys(results)
    .map((p: string) => moment(p).format("LLL"))
    .reverse();

  const selectedClass = (scale: Number) => {
    switch (scale) {
      case 1:
        return "text-red-200 hover:bg-red-400";
      case 2:
        return "text-red-400 hover:bg-red-500";
      case 3:
        return "text-red-500 hover:bg-red-600";
      case 4:
        return "text-red-600 hover:bg-red-700";
      case 5:
        return "text-red-700 hover:bg-gray-400";

      default:
        return "text-gray-400 hover:bg-red-400";
    }
  };

  const selectedLabelClass = (scale: Number) => {
    switch (scale) {
      case 1:
        return "bg-red-200 text-red-700 hover:bg-red-400";
      case 2:
        return "bg-red-400 text-white hover:bg-red-500";
      case 3:
        return "bg-red-500 text-white hover:bg-red-600";
      case 4:
        return "bg-red-600 text-white hover:bg-red-700";
      case 5:
        return "bg-red-700 text-white hover:bg-red-200";

      default:
        return "bg-gray-300 text-black hover:bg-red-200";
    }
  };

  const renderBody = (title: string, parts: Array<any>) => {
    return (
      <div className=" w-full text-center mx-2">
        <div className="text-2xl font-bold mt-10"> {title} </div>
        <div className="text-left font-bold mx-auto mt-5">
          Braden Scale (Risk Severity) ({title})
        </div>
        <div className="mx-auto overflow-x-scroll max-w-md my-3 border-2">
          <div className="grid grid-rows-3 md:grid-rows-6 grid-flow-col gap-2 auto-cols-max justify-items-center p-2">
            {parts.map((p, i) => {
              let ind = selectedData.region.indexOf(p.region);
              let classSelected =
                ind > -1
                  ? selectedLabelClass(selectedData.scale[ind])
                  : selectedLabelClass(0);
              return (
                <div
                  key={i}
                  className={`p-1 col-auto text-sm rounded m-1 border-2 ${classSelected}`}
                  id={p.region}
                >
                  {p.label}
                </div>
              );
            })}
          </div>
        </div>
        {/* Diagram */}
        <div className="flex justify-center max-w-lg mx-auto border-2">
          <svg
            className="h-screen py-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 344.7 932.661"
          >
            {parts.map((p, index) => {
              let ind = selectedData.region.indexOf(p.region);
              let classSelected =
                ind > -1
                  ? selectedClass(selectedData.scale[ind])
                  : selectedClass(0);
              return (
                <path
                  key={index}
                  d={p.d}
                  transform={p.transform}
                  fill="currentColor"
                  className={classSelected}
                  id={`part${p.region}`}
                >
                  <title>{p.label}</title>
                </path>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div>
      <select title="date">
        {dates.map((x, i) => {
          return (
            <option key={i} value={x}>
              {x}
            </option>
          );
        })}
      </select>
      {!isLoading && (
        <div className="flex md:flex-row flex-col justify-between">
          {renderBody("Front", anteriorParts)}
          {renderBody("Back", posteriorParts)}
        </div>
      )}
    </div>
  );
};
