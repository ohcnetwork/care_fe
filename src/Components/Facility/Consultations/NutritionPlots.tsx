import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import { StackedLinePlot } from "./components/StackedLinePlot";

export const NutritionPlots = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});
  const [showIO, setShowIO] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
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
          console.log(res.data);
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

  //IO Balance
  const IOvalues = Object.values(results)
    .map(
      (p: any) => p["total_intake_calculated"] - p["total_output_calculated"]
    )
    .reverse();

  //Infusions
  const infusionList: any = [];
  Object.values(results).map((p: any) =>
    p.infusions.map((x: any) =>
      infusionList.indexOf(x.name) === -1 ? infusionList.push(x.name) : null
    )
  );

  let infusionsData: any = {};
  infusionList.map(
    (x: any) =>
      (infusionsData[x] = {
        name: x,
        data: [...Array(Object.keys(results).length).fill(undefined)],
      })
  );

  Object.values(results)
    .reverse()
    .map((p: any, i: any) => {
      const infusions = p.infusions;
      infusions.map((infusion: any) => {
        const item = infusionsData[infusion.name];
        item.data[i] = infusion.quantity;
      });
    });

  //IV Fluids
  const IVFluidsList: any = [];
  Object.values(results).map((p: any) =>
    p.iv_fluids.map((x: any) =>
      IVFluidsList.indexOf(x.name) === -1 ? IVFluidsList.push(x.name) : null
    )
  );

  let IVFluidsData: any = {};
  IVFluidsList.map(
    (x: any) =>
      (IVFluidsData[x] = {
        name: x,
        data: [...Array(Object.keys(results).length).fill(undefined)],
      })
  );

  Object.values(results)
    .reverse()
    .map((p: any, i: any) => {
      const iv_fluids = p.iv_fluids;
      iv_fluids.map((iv_fluid: any) => {
        const item = IVFluidsData[iv_fluid.name];
        item.data[i] = iv_fluid.quantity;
      });
    });

  //Feeds
  const FeedsList: any = [];
  Object.values(results).map((p: any) =>
    p.feeds.map((x: any) =>
      FeedsList.indexOf(x.name) === -1 ? FeedsList.push(x.name) : null
    )
  );

  let FeedsData: any = {};
  FeedsList.map(
    (x: any) =>
      (FeedsData[x] = {
        name: x,
        data: [...Array(Object.keys(results).length).fill(undefined)],
      })
  );

  Object.values(results)
    .reverse()
    .map((p: any, i: any) => {
      p.feeds.map((feed: any) => {
        const item = FeedsData[feed.name];
        item.data[i] = feed.quantity;
      });
    });

  console.log(results, IVFluidsData);

  return (
    <div>
      <section className="rounded-lg shadow p-4 h-full space-y-2 text-gray-100 my-4">
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
      <section className="rounded-lg shadow p-4 h-full space-y-2 text-gray-100 my-4">
        <div
          className="flex justify-between border-b border-dashed text-gray-900 font-semibold text-left text-lg pb-2"
          onClick={() => setShowIntake(!showIntake)}
        >
          <div>Total Intake</div>
          {showIntake ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </div>
        <div
          className={
            showIntake ? "grid grid-row-1 md:grid-cols-2 gap-4" : "hidden"
          }
        >
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <LinePlot
              title="Total Intake"
              name="Total Intake"
              xData={dates}
              yData={yAxisData("total_intake_calculated")}
            />
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <StackedLinePlot
              title="Infusions"
              xData={dates}
              yData={Object.values(infusionsData)}
            />
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <StackedLinePlot
              title="IV Fluids"
              xData={dates}
              yData={Object.values(IVFluidsData)}
            />
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <StackedLinePlot
              title="Feeds"
              xData={dates}
              yData={Object.values(FeedsData)}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
