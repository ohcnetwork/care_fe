import { useEffect, useState } from "react";
import routes from "../../../Redux/api";
import request from "../../../Utils/request/request";
import { LinePlot } from "./components/LinePlot";
import Pagination from "../../Common/Pagination";
import { PAGINATION_LIMIT } from "../../../Common/constants";
import { formatDateTime } from "../../../Utils/utils";
import BinaryChronologicalChart from "./components/BinaryChronologicalChart";
import { VentilatorPlotFields } from "../models";
import { DailyRoundsModel } from "../../Patient/models";
import { useTranslation } from "react-i18next";

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

export const VentilatorPlot = ({
  consultationId,
  dailyRoundsList,
}: {
  consultationId: string;
  dailyRoundsList?: DailyRoundsModel[];
}) => {
  const [results, setResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDailyRounds = async (
      currentPage: number,
      consultationId: string,
    ) => {
      const { res, data } = await request(routes.dailyRoundsAnalyse, {
        body: { page: currentPage, fields: VentilatorPlotFields },
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

  const getConditions = (name: string, currentRound: DailyRoundsModel) => {
    let condition = false;
    let legend = "";
    switch (name) {
      case "ventilator_pip":
      case "ventilator_mean_airway_pressure":
      case "ventilator_resp_rate":
      case "ventilator_pressure_support":
      case "ventilator_tidal_volume":
      case "ventilator_peep":
        condition =
          (currentRound.ventilator_interface == "INVASIVE" ||
            currentRound.ventilator_interface == "NON_INVASIVE") &&
          !!currentRound.ventilator_mode;
        break;
      case "ventilator_fio2":
        condition =
          currentRound.ventilator_interface == "OXYGEN_SUPPORT" &&
          currentRound.ventilator_oxygen_modality == "HIGH_FLOW_NASAL_CANNULA";
        break;
      case "ventilator_spo2":
        condition =
          currentRound.ventilator_interface == "OXYGEN_SUPPORT" &&
          (currentRound.ventilator_oxygen_modality == "NASAL_PRONGS" ||
            currentRound.ventilator_oxygen_modality == "SIMPLE_FACE_MASK" ||
            currentRound.ventilator_oxygen_modality == "NON_REBREATHING_MASK" ||
            currentRound.ventilator_oxygen_modality ==
              "HIGH_FLOW_NASAL_CANNULA");
        break;
      case "etco2":
      case "ventilator_oxygen_modality_flow_rate":
        condition =
          !!currentRound.ventilator_mode ||
          !!currentRound.ventilator_oxygen_modality ||
          false;
        break;
      case "ventilator_oxygen_modality_oxygen_rate":
        condition =
          currentRound.ventilator_interface == "OXYGEN_SUPPORT" &&
          (currentRound.ventilator_oxygen_modality == "NASAL_PRONGS" ||
            currentRound.ventilator_oxygen_modality == "SIMPLE_FACE_MASK" ||
            currentRound.ventilator_oxygen_modality == "NON_REBREATHING_MASK");
        break;
    }
    switch (currentRound.ventilator_interface) {
      case "OXYGEN_SUPPORT":
        legend = t(
          `OXYGEN_MODALITY__${currentRound.ventilator_oxygen_modality}_short`,
        );
        break;
      case "INVASIVE":
      case "NON_INVASIVE":
        legend = t(`VENTILATOR_MODE__${currentRound.ventilator_mode}_short`);
    }
    return { condition, legend };
  };

  const getModeOrModality = (round: DailyRoundsModel) => {
    const ventilatorInterface = round.ventilator_interface;
    const modeOrModality =
      ventilatorInterface == "INVASIVE" || ventilatorInterface == "NON_INVASIVE"
        ? round.ventilator_mode
        : ventilatorInterface == "OXYGEN_SUPPORT"
          ? round.ventilator_oxygen_modality
          : null;
    return modeOrModality;
  };

  const getMarkAreaData = (name: string) => {
    const markAreaData = [];
    const colorList = ["rgb(226,225,226, 0.2)", "rgb(226,225,226, 0.8)"];
    let colorFlag = true;
    let currentColor = colorList[0];
    if (!dailyRoundsList) return [];
    for (let index = 0; index < dailyRoundsList.length - 1; index++) {
      const currentRound = dailyRoundsList[index];
      const { condition, legend } = getConditions(name, currentRound);
      const currentInterfaceOrModality = getModeOrModality(currentRound);
      if (condition) {
        const currentCoords = [];
        const startIndex = dates.findIndex(
          (element) => element == currentRound.taken_at,
        );
        if (startIndex != -1) {
          while (index < dailyRoundsList.length - 1) {
            const nextRound = dailyRoundsList[index + 1];
            const nextInterfaceOrModality = getModeOrModality(nextRound);
            if (
              currentRound.ventilator_interface ==
                nextRound.ventilator_interface &&
              currentInterfaceOrModality == nextInterfaceOrModality
            ) {
              index += 1;
            } else {
              break;
            }
          }
          const endIndex = dates.findIndex(
            (element) => element == dailyRoundsList[index + 1].taken_at,
          );
          currentColor = colorFlag ? colorList[0] : colorList[1];
          colorFlag = !colorFlag;
          currentCoords.push({
            name: legend,
            xAxis: dates[startIndex],
            itemStyle: {
              color: currentColor,
            },
            borderJoin: "miter",
          });
          currentCoords.push({
            xAxis: dates[endIndex],
            label: {
              rotate: 30,
              formatter: legend,
              distance: 20,
              align: "center",
              verticalAlign: "top",
              position: "top",
            },
          });
          markAreaData.push(currentCoords);
        }
      }
    }
    return markAreaData;
  };

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
            verticalMarkerData={getMarkAreaData("ventilator_pip")}
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
            verticalMarkerData={getMarkAreaData(
              "ventilator_mean_airway_pressure",
            )}
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
            verticalMarkerData={getMarkAreaData("ventilator_resp_rate")}
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
            verticalMarkerData={getMarkAreaData("ventilator_pressure_support")}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Tidal Volume"
            name="Tidal Volume"
            xData={dates}
            yData={yAxisData("ventilator_tidal_volume")}
            verticalMarkerData={getMarkAreaData("ventilator_tidal_volume")}
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
            verticalMarkerData={getMarkAreaData("ventilator_peep")}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="FiO2"
            name="FiO2"
            xData={dates}
            yData={yAxisData("ventilator_fio2")}
            low={21}
            high={60}
            verticalMarkerData={getMarkAreaData("ventilator_fio2")}
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
            verticalMarkerData={getMarkAreaData("ventilator_spo2")}
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
            verticalMarkerData={getMarkAreaData("etco2")}
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
            verticalMarkerData={getMarkAreaData(
              "ventilator_oxygen_modality_oxygen_rate",
            )}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Flow Rate"
            name="Flow Rate"
            xData={dates}
            yData={yAxisData("ventilator_oxygen_modality_flow_rate")}
            verticalMarkerData={getMarkAreaData(
              "ventilator_oxygen_modality_flow_rate",
            )}
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
