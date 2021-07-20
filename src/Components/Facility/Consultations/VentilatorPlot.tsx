import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";

export const VentilatorPlot = (props: any) => {
  const { facilityId, patientId, consultationId } = props;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [results, setResults] = useState({});

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            offset,
            fields: [
              "ventilator_pip",
              "ventilator_mean_airway_pressure",
              "ventilator_resp_rate",
              "ventilator_pressure_support",
              "ventilator_tidal_volume",
              "ventilator_peep",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          setResults(res.data);
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

  return (
    <div className="grid grid-row-1 md:grid-cols-2 gap-4">
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <LinePlot
          title="PIP"
          name="PIP"
          xData={dates}
          yData={yAxisData("ventilator_pip")}
          low={12}
          high={30}
        />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <LinePlot
          title="MAP"
          name="MAP"
          xData={dates}
          yData={yAxisData("ventilator_mean_airway_pressure")}
          low={12}
          high={25}
        />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <LinePlot
          title="Resp Rate"
          name="resp"
          xData={dates}
          yData={yAxisData("ventilator_resp_rate")}
          low={12}
          high={20}
        />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <LinePlot
          title="Pressure Support"
          name="Pressure Support"
          xData={dates}
          yData={yAxisData("ventilator_pressure_support")}
          low={5}
          high={15}
        />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <LinePlot
          title="Tidal Volume"
          name="Tidal Volume"
          xData={dates}
          yData={yAxisData("ventilator_tidal_volume")}
        />
      </div>
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <LinePlot
          title="PEEP"
          name="PEEP"
          xData={dates}
          yData={yAxisData("ventilator_peep")}
          low={5}
          high={10}
        />
      </div>
    </div>
  );
};
