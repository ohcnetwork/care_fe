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
              return (
                <div
                  key={i}
                  className="p-1 col-auto text-sm rounded m-1 cursor-pointer border-2"
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
              return (
                <path
                  key={index}
                  d={p.d}
                  transform={p.transform}
                  fill="currentColor"
                ></path>
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
        {dates.map((x) => {
          return <option value={x}>{x}</option>;
        })}
      </select>
      <div className="flex md:flex-row flex-col justify-between">
        {renderBody("Front", anteriorParts)}
        {renderBody("Back", posteriorParts)}
      </div>
    </div>
  );
};
