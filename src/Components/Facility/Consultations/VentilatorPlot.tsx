import moment from "moment";
import { type } from "os";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";

interface ModalityType {
  id: number;
  type: string;
  normal_rate_low: number;
  normal_rate_high: number;
}

const modality: Array<ModalityType> = [
  { id: 0, type: "UNKNOWN", normal_rate_low: 1, normal_rate_high: 4 },
  { id: 5, type: "NASAL_PRONGS", normal_rate_low: 5, normal_rate_high: 10 },
  {
    id: 10,
    type: "SIMPLE_FACE_MASK",
    normal_rate_low: 11,
    normal_rate_high: 15,
  },
];

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
              "ventilator_fi02",
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

  console.log(results);

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
      <div className="pt-4 px-4 bg-white border rounded-lg shadow">
        <LinePlot
          title="FiO2"
          name="FiO2"
          xData={dates}
          yData={yAxisData("ventilator_fi02")}
          low={5}
          high={10}
        />
      </div>
    </div>
  );
};
