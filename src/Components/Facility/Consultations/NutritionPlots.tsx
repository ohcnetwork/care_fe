import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import { StackedLinePlot } from "./components/StackedLinePlot";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";

export const NutritionPlots = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({});
  const [showIO, setShowIO] = useState(true);
  const [showIntake, setShowIntake] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            page: currentPage,
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
          setTotalCount(res.data.count);
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
    [currentPage]
  );

  const handlePagination = (page: number, limit: number) => {
    setCurrentPage(page);
  };

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
      p.infusions.map((infusion: any) => {
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
      p.iv_fluids.map((iv_fluid: any) => {
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

  //Feeds
  const OutputList: any = [];
  Object.values(results).map((p: any) =>
    p.output.map((x: any) =>
      OutputList.indexOf(x.name) === -1 ? OutputList.push(x.name) : null
    )
  );

  let OutputData: any = {};
  OutputList.map(
    (x: any) =>
      (OutputData[x] = {
        name: x,
        data: [...Array(Object.keys(results).length).fill(undefined)],
      })
  );

  Object.values(results)
    .reverse()
    .map((p: any, i: any) => {
      p.output.map((x: any) => {
        const item = OutputData[x.name];
        item.data[i] = x.quantity;
      });
    });

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
          <div />
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <LinePlot
              title="Total Intake"
              name="Total Intake"
              xData={dates}
              yData={yAxisData("total_intake_calculated")}
            />
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <LinePlot
              title="Total Output"
              name="Total Output"
              xData={dates}
              yData={yAxisData("total_output_calculated")}
            />
          </div>
        </div>
      </section>
      <section className="rounded-lg shadow p-4 h-full space-y-2 text-gray-100 my-4 h-44">
        <div
          className="flex justify-between border-b border-dashed text-gray-900 font-semibold text-left text-lg pb-2"
          onClick={() => setShowIntake(!showIntake)}
        >
          <div>Intake</div>
          {showIntake ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </div>
        <div className={showIntake ? "grid md:grid-cols-2 gap-4" : "hidden"}>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <LinePlot
              title="Total Intake"
              name="Total Intake"
              xData={dates}
              yData={yAxisData("total_intake_calculated")}
            />
          </div>
          <div />
          <div className="pt-4 px-4 bg-white border rounded-lg shadow ">
            <StackedLinePlot
              title="Infusions"
              xData={dates}
              yData={Object.values(infusionsData)}
            />
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow text-gray-900">
            <h3 className="text-lg">Infusions:</h3>
            <div className="overflow-y-auto pb-2 h-72">
              {Object.entries(results).map((obj: any) => {
                if (obj[1].infusions && obj[1].infusions.length > 0) {
                  return (
                    <div>
                      <h4 className="text-sm">
                        - {moment(obj[0]).format("LLL")}
                      </h4>
                      <div className="px-5 text-sm">
                        {obj[1].infusions.map((o: any) => (
                          <div>
                            {o.name} - {o.quantity}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <StackedLinePlot
              title="IV Fluids"
              xData={dates}
              yData={Object.values(IVFluidsData)}
            />
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow text-gray-900">
            <h3 className="text-lg">IV Fluids:</h3>
            <div className="overflow-y-auto pb-2 h-72">
              {Object.entries(results).map((obj: any) => {
                if (obj[1].iv_fluids && obj[1].iv_fluids.length > 0) {
                  return (
                    <div>
                      <h4 className="text-sm">
                        - {moment(obj[0]).format("LLL")}
                      </h4>
                      <div className="px-5 text-sm">
                        {obj[1].iv_fluids.map((o: any) => (
                          <div>
                            {o.name} - {o.quantity}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <StackedLinePlot
              title="Feeds"
              xData={dates}
              yData={Object.values(FeedsData)}
            />
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow text-gray-900">
            <h3 className="text-lg">Feeds:</h3>
            <div className="overflow-y-auto pb-2 h-72">
              {Object.entries(results).map((obj: any) => {
                if (obj[1].feeds && obj[1].feeds.length > 0) {
                  return (
                    <div>
                      <h4 className="text-sm">
                        - {moment(obj[0]).format("LLL")}
                      </h4>
                      <div className="px-5 text-sm">
                        {obj[1].feeds.map((o: any) => (
                          <div>
                            {o.name} - {o.quantity}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-lg shadow p-4 h-full space-y-2 text-gray-100 my-4">
        <div
          className="flex justify-between border-b border-dashed text-gray-900 font-semibold text-left text-lg pb-2"
          onClick={() => setShowOutput(!showOutput)}
        >
          <div> Output</div>
          {showOutput ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </div>
        <div
          className={
            showOutput ? "grid grid-row-1 md:grid-cols-2 gap-4" : "hidden"
          }
        >
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <LinePlot
              title="Total Output"
              name="Total Output"
              xData={dates}
              yData={yAxisData("total_output_calculated")}
            />
          </div>
          <div />
          <div className="pt-4 px-4 bg-white border rounded-lg shadow">
            <StackedLinePlot
              title="Output"
              xData={dates}
              yData={Object.values(OutputData)}
            />
          </div>
          <div className="pt-4 px-4 bg-white border rounded-lg shadow text-gray-900">
            <h3 className="text-lg">Output:</h3>
            <div className="overflow-y-auto pb-2 h-72">
              {Object.entries(results).map((obj: any) => {
                if (obj[1].output && obj[1].output.length > 0) {
                  return (
                    <div>
                      <h4 className="text-sm">
                        - {moment(obj[0]).format("LLL")}
                      </h4>
                      <div className="px-5 text-sm">
                        {obj[1].output.map((o: any) => (
                          <div>
                            {o.name} - {o.quantity}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </section>

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
