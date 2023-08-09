import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";
import { formatDateTime } from "../../../Utils/utils";
import BinaryChronologicalChart from "./components/BinaryChronologicalChart";

/*
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
*/

export const VentilatorPlot = (props: any) => {
  const { consultationId } = props;
  const dispatch: any = useDispatch();
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      const res = await dispatch(
        dailyRoundsAnalyse(
          {
            page: currentPage,
            fields: [
              "ventilator_pip",
              "ventilator_mean_airway_pressure",
              "ventilator_resp_rate",
              "ventilator_pressure_support",
              "ventilator_tidal_volume",
              "ventilator_peep",
              "ventilator_fi02",
              "ventilator_spo2",
              "etco2",
              "bilateral_air_entry",
              "ventilator_oxygen_modality_oxygen_rate",
              "ventilator_oxygen_modality_flow_rate",
            ],
          },
          { consultationId }
        )
      );
      if (!status.aborted) {
        if (res && res.data) {
          console.log(res);
          setResults(res.data.results);
          setTotalCount(res.data.count);
        }
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

  const bilateral = Object.values(results)
    .map((p: any, i) => {
      return {
        value: p.bilateral_air_entry,
        timestamp: Object.keys(results)[i],
      };
    })
    .filter((p) => p.value !== null);

  useEffect(() => {
    console.log(bilateral);
  }, [bilateral]);

  return (
    <div>
      <div className="grid-row-1 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="PIP"
            name="PIP"
            xData={dates}
            yData={yAxisData("ventilator_pip")}
            low={12}
            high={30}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="MAP"
            name="MAP"
            xData={dates}
            yData={yAxisData("ventilator_mean_airway_pressure")}
            low={12}
            high={25}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Resp Rate"
            name="resp"
            xData={dates}
            yData={yAxisData("ventilator_resp_rate")}
            low={12}
            high={20}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Pressure Support"
            name="Pressure Support"
            xData={dates}
            yData={yAxisData("ventilator_pressure_support")}
            low={5}
            high={15}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Tidal Volume"
            name="Tidal Volume"
            xData={dates}
            yData={yAxisData("ventilator_tidal_volume")}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="PEEP"
            name="PEEP"
            xData={dates}
            yData={yAxisData("ventilator_peep")}
            low={5}
            high={10}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="FiO2"
            name="FiO2"
            xData={dates}
            yData={yAxisData("ventilator_fi02")}
            low={21}
            high={60}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="SpO2"
            name="SpO2"
            xData={dates}
            yData={yAxisData("ventilator_spo2")}
            low={90}
            high={100}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="EtCo2"
            name="EtCo2"
            xData={dates}
            yData={yAxisData("etco2")}
            low={35}
            high={45}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <BinaryChronologicalChart
            title="Bilateral Air Entry"
            data={bilateral}
            trueName="Yes"
            falseName="No"
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Oxygen Flow Rate"
            name="Oxygen Flow Rate"
            xData={dates}
            yData={yAxisData("ventilator_oxygen_modality_oxygen_rate")}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Flow Rate"
            name="Flow Rate"
            xData={dates}
            yData={yAxisData("ventilator_oxygen_modality_flow_rate")}
          />
        </div>
      </div>

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
