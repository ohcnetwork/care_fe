import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Pagination from "@/components/Common/Pagination";
import { LinePlot } from "@/components/Facility/Consultations/components/LinePlot";
import { StackedLinePlot } from "@/components/Facility/Consultations/components/StackedLinePlot";
import { NutritionPlotsFields } from "@/components/Facility/models";

import { PAGINATION_LIMIT } from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

export const NutritionPlots = (props: any) => {
  const { consultationId } = props;
  const [results, setResults] = useState({});
  const [showIO, setShowIO] = useState(true);
  const [showIntake, setShowIntake] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchDailyRounds = async (
      currentPage: number,
      consultationId: string,
    ) => {
      const { res, data } = await request(routes.dailyRoundsAnalyse, {
        body: { page: currentPage, fields: NutritionPlotsFields },
        pathParams: {
          consultationId,
        },
      });
      if (res && res.ok && data) {
        setResults(data.results);
        setTotalCount(data.count);
      }
    };

    fetchDailyRounds(currentPage, consultationId);
  }, [consultationId, currentPage]);

  const handlePagination = (page: number) => {
    setCurrentPage(page);
  };

  const dates = Object.keys(results)
    .map((p: string) => formatDateTime(p))
    .reverse();

  const yAxisData = (name: string) => {
    return Object.values(results)
      .map((p: any) => p[name])
      .reverse();
  };

  //IO Balance
  const IOvalues = Object.values(results)
    .map(
      (p: any) => p["total_intake_calculated"] - p["total_output_calculated"],
    )
    .reverse();

  //Infusions
  const infusionList: any = [];
  Object.values(results).map((p: any) =>
    p.infusions.map((x: any) =>
      infusionList.indexOf(x.name) === -1 ? infusionList.push(x.name) : null,
    ),
  );

  const infusionsData: any = {};
  infusionList.map(
    (x: any) =>
      (infusionsData[x] = {
        name: x,
        data: [...Array(Object.keys(results).length).fill(undefined)],
      }),
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
      IVFluidsList.indexOf(x.name) === -1 ? IVFluidsList.push(x.name) : null,
    ),
  );

  const IVFluidsData: any = {};
  IVFluidsList.map(
    (x: any) =>
      (IVFluidsData[x] = {
        name: x,
        data: [...Array(Object.keys(results).length).fill(undefined)],
      }),
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
      FeedsList.indexOf(x.name) === -1 ? FeedsList.push(x.name) : null,
    ),
  );

  const FeedsData: any = {};
  FeedsList.map(
    (x: any) =>
      (FeedsData[x] = {
        name: x,
        data: [...Array(Object.keys(results).length).fill(undefined)],
      }),
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
      OutputList.indexOf(x.name) === -1 ? OutputList.push(x.name) : null,
    ),
  );

  const OutputData: any = {};
  OutputList.map(
    (x: any) =>
      (OutputData[x] = {
        name: x,
        data: [...Array(Object.keys(results).length).fill(undefined)],
      }),
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
      <section className="my-4 h-full space-y-2 rounded-lg bg-white p-4 text-secondary-100 shadow">
        <div
          className="flex justify-between border-b border-dashed pb-2 text-left text-lg font-semibold text-secondary-900"
          onClick={() => setShowIO(!showIO)}
        >
          <div> IO Balance Plots</div>
          {showIO ? (
            <CareIcon icon="l-angle-up" className="text-2xl font-bold" />
          ) : (
            <CareIcon icon="l-angle-down" className="text-2xl font-bold" />
          )}
        </div>

        <div
          className={showIO ? "grid-row-1 grid gap-4 md:grid-cols-2" : "hidden"}
        >
          <div className="rounded-lg border bg-white p-4 md:col-span-2">
            <LinePlot
              title="IO Balance"
              name="IO Balance"
              xData={dates}
              yData={IOvalues}
            />
          </div>
          <div className="rounded-lg border bg-white p-4">
            <LinePlot
              title="Total Intake"
              name="Total Intake"
              xData={dates}
              yData={yAxisData("total_intake_calculated")}
            />
          </div>
          <div className="rounded-lg border bg-white p-4">
            <LinePlot
              title="Total Output"
              name="Total Output"
              xData={dates}
              yData={yAxisData("total_output_calculated")}
            />
          </div>
        </div>
      </section>
      <section className="my-4 h-full space-y-2 rounded-lg bg-white p-4 text-secondary-100 shadow">
        <div
          className="flex justify-between border-b border-dashed pb-2 text-left text-lg font-semibold text-secondary-900"
          onClick={() => setShowIntake(!showIntake)}
        >
          <div>Intake</div>
          {showIntake ? (
            <CareIcon icon="l-angle-up" className="text-2xl font-bold" />
          ) : (
            <CareIcon icon="l-angle-down" className="text-2xl font-bold" />
          )}
        </div>
        <div className={showIntake ? "grid gap-4 md:grid-cols-2" : "hidden"}>
          <div className="rounded-lg border bg-white p-4 md:col-span-2">
            <LinePlot
              title="Total Intake"
              name="Total Intake"
              xData={dates}
              yData={yAxisData("total_intake_calculated")}
            />
          </div>
          <div className="rounded-lg border bg-white p-4">
            <StackedLinePlot
              title="Infusions"
              xData={dates}
              yData={Object.values(infusionsData)}
            />
          </div>
          <div className="rounded-lg border bg-white p-4 text-secondary-900">
            <h3 className="text-lg">Infusions:</h3>
            <div className="h-72 overflow-y-auto pb-2">
              {Object.entries(results).map((obj: any) => {
                if (obj[1].infusions && obj[1].infusions.length > 0) {
                  return (
                    <div>
                      <h4 className="text-sm">- {formatDateTime(obj[0])}</h4>
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
          <div className="rounded-lg border bg-white p-4">
            <StackedLinePlot
              title="IV Fluids"
              xData={dates}
              yData={Object.values(IVFluidsData)}
            />
          </div>
          <div className="rounded-lg border bg-white p-4 text-secondary-900">
            <h3 className="text-lg">IV Fluids:</h3>
            <div className="h-72 overflow-y-auto pb-2">
              {Object.entries(results).map((obj: any) => {
                if (obj[1].iv_fluids && obj[1].iv_fluids.length > 0) {
                  return (
                    <div>
                      <h4 className="text-sm">- {formatDateTime(obj[0])}</h4>
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
          <div className="rounded-lg border bg-white p-4">
            <StackedLinePlot
              title="Feeds"
              xData={dates}
              yData={Object.values(FeedsData)}
            />
          </div>
          <div className="rounded-lg border bg-white p-4 text-secondary-900">
            <h3 className="text-lg">Feeds:</h3>
            <div className="h-72 overflow-y-auto pb-2">
              {Object.entries(results).map((obj: any) => {
                if (obj[1].feeds && obj[1].feeds.length > 0) {
                  return (
                    <div>
                      <h4 className="text-sm">- {formatDateTime(obj[0])}</h4>
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
      <section className="my-4 h-full space-y-2 rounded-lg bg-white p-4 text-secondary-100 shadow">
        <div
          className="flex justify-between border-b border-dashed pb-2 text-left text-lg font-semibold text-secondary-900"
          onClick={() => setShowOutput(!showOutput)}
        >
          <div> Output</div>
          {showOutput ? (
            <CareIcon icon="l-angle-up" className="text-2xl font-bold" />
          ) : (
            <CareIcon icon="l-angle-down" className="text-2xl font-bold" />
          )}
        </div>
        <div
          className={
            showOutput ? "grid-row-1 grid gap-4 md:grid-cols-2" : "hidden"
          }
        >
          <div className="rounded-lg border bg-white p-4 md:col-span-2">
            <LinePlot
              title="Total Output"
              name="Total Output"
              xData={dates}
              yData={yAxisData("total_output_calculated")}
            />
          </div>
          <div className="rounded-lg border bg-white p-4">
            <StackedLinePlot
              title="Output"
              xData={dates}
              yData={Object.values(OutputData)}
            />
          </div>
          <div className="rounded-lg border bg-white p-4 text-secondary-900">
            <h3 className="text-lg">Output:</h3>
            <div className="h-72 overflow-y-auto pb-2">
              {Object.entries(results).map((obj: any) => {
                if (obj[1].output && obj[1].output.length > 0) {
                  return (
                    <div>
                      <h4 className="text-sm">- {formatDateTime(obj[0])}</h4>
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
