import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";

export const NutritionPlots = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});
  const [showIO, setShowIO] = useState(false);
  const limit = 14;

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            limit,
            offset,
            fields: [
              "infusions",
              "iv_fluids",
              "feeds",
              "total_intake_calculated",
              "total_output_calculated",
              "output",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
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

  const dates = Object.keys(results)
    .map((p: string) => moment(p).format("LLL"))
    .reverse();

  const yAxisData = (name: string) => {
    return Object.values(results)
      .map((p: any) => p[name])
      .reverse();
  };

  const IOvalues = Object.values(results)
    .map(
      (p: any) => p["total_intake_calculated"] - p["total_output_calculated"]
    )
    .reverse();

  console.log(showIO, results, IOvalues);

  return (
    <div>
      <section className=" bg-white rounded-lg shadow p-4 h-full space-y-2 text-gray-100 my-4">
        <div
          className="flex justify-between border-b border-dashed text-gray-900 font-semibold text-left text-lg pb-2"
          onClick={() => setShowIO(!showIO)}
        >
          <div> IO Balance Plots</div>
          {showIO ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </div>
        <div
          className={showIO ? "grid grid-row-1 md:grid-cols-2 gap-4" : "hidden"}
        >
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <LinePlot
              title="IO Balance"
              name="IO Balance"
              xData={dates}
              yData={IOvalues}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
