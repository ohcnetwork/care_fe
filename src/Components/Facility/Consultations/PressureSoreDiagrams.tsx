import moment from "moment";
import { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { anteriorParts, posteriorParts } from "./PressureSoreConstants";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";

export const PressureSoreDiagrams = (props: any) => {
  const { consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [selectedData, setData] = useState<any>({
    region: [],
    scale: [],
  });
  const [currentPart, setPart] = useState<any>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            page: currentPage,
            fields: ["pressure_sore"],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setResults(res.data);
          setTotalCount(res.data.count);
          let keys = Object.keys(results).reverse();
          if (keys.length > 0) {
            setSelectedDateData(res.data, keys[0]);
          }
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, currentPage]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchDailyRounds(status);
    },
    [consultationId, currentPage]
  );

  const handlePagination = (page: number, limit: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    if (Object.keys(results).length > 0)
      setSelectedDateData(results, Object.keys(results?.["results"])[0]);
  }, [results]);

  const setSelectedDateData = (results: any, key: any) => {
    let obj = results["results"][key]?.["pressure_sore"];
    let regions: Array<string> = [],
      scales: Array<Number> = [];
    obj?.forEach((x: any) => {
      regions.push(x.region);
      scales.push(x.scale);
    });
    setData({
      region: regions,
      scale: scales,
    });
  };

  let dates: any = [];
  if (Object.keys(results).length > 0) {
    dates = Object.keys(results?.["results"]);
  }
  const selectedClass = (scale: Number) => {
    switch (scale) {
      case 1:
        return "text-red-200 hover:text-red-400 tooltip cursor-pointer";
      case 2:
        return "text-red-400 hover:text-red-500 tooltip cursor-pointer";
      case 3:
        return "text-red-500 hover:text-red-600 tooltip cursor-pointer";
      case 4:
        return "text-red-600 hover:text-red-700 tooltip cursor-pointer";
      case 5:
        return "text-red-700 hover:text-gray-400 tooltip cursor-pointer";

      default:
        return "text-gray-400 hover:text-red-200 tooltip cursor-pointer";
    }
  };

  const dropdown = (dates: Array<any>) => {
    return dates && dates.length > 0 ? (
      <div className="mx-auto">
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
  const getIntoView = (region: string, isPart: boolean) => {
    if (currentPart && currentPart.timerId && currentPart.timerId > 0) {
      window.clearTimeout(currentPart.timerId);
      currentPart.label.classList.remove("border-2");
      currentPart.label.classList.remove("border-red-700");

      currentPart.part.classList.remove("text-red-900");
    }

    // Label
    let ele = document.getElementById(region);
    if (isPart) {
      ele?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    ele?.classList.add("border-2");
    ele?.classList.add("border-red-700");

    //Part
    let part = document.getElementById(`part${region}`);
    if (!isPart) {
      part?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    part?.classList.add("text-red-900");

    let id = window.setTimeout(() => {
      ele?.classList.remove("border-2");
      ele?.classList.remove("border-red-700");

      part?.classList.remove("text-red-900");
    }, 1000);
    setPart({ timerId: id, label: ele, part: part });
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
                  className={`p-1 cursor-pointer col-auto text-sm rounded m-1 border-2 ${classSelected}`}
                  id={p.region}
                  onClick={() => getIntoView(p.region, false)}
                >
                  {p.label}
                  {ind > -1 ? ` | ${selectedData.scale[ind]}` : ""}
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
                  onClick={() => getIntoView(p.region, true)}
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
      {dates && dropdown(dates)}
      {!isLoading && (
        <div className="flex md:flex-row flex-col justify-between">
          {renderBody("Front", anteriorParts)}
          {renderBody("Back", posteriorParts)}
        </div>
      )}
      {totalCount > PAGINATION_LIMIT && (
        <div className="mt-4 flex w-full justify-center">
          <Pagination
            cPage={currentPage}
            defaultPerPage={PAGINATION_LIMIT}
            data={{ totalCount }}
            onChange={handlePagination}
          />
        </div>
      )}
    </div>
  );
};
