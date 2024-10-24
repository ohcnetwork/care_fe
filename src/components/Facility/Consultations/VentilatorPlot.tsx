import { useEffect, useState } from "react";
import { LinePlot } from "./components/LinePlot";
import { formatDateTime } from "../../../Utils/utils";
import BinaryChronologicalChart from "./components/BinaryChronologicalChart";
import { DailyRoundsModel } from "../../Patient/models";
import { useTranslation } from "react-i18next";
import Loading from "../../Common/Loading";

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
  dailyRoundsList,
}: {
  dailyRoundsList?: DailyRoundsModel[];
}) => {
  const [results, setResults] = useState({});
  const { t } = useTranslation();

  useEffect(() => {
    const { graphData } = getGraphData(dailyRoundsList);
    setResults(graphData);
  }, [dailyRoundsList]);

  const getGraphData = (dailyRoundsData?: DailyRoundsModel[]) => {
    let graphData = {};
    const graphDataCount = dailyRoundsData?.length ?? 0;
    if (dailyRoundsData) {
      graphData = dailyRoundsData.reduce(
        (acc, currentRound: DailyRoundsModel) => ({
          ...acc,
          //@ts-expect-error taken_at should always be available
          [currentRound.taken_at]: {
            bilateral_air_entry: currentRound.bilateral_air_entry,
            etco2: currentRound.etco2,
            id: currentRound.id,
            ventilator_fio2: currentRound.ventilator_fio2,
            ventilator_mean_airway_pressure:
              currentRound.ventilator_mean_airway_pressure,
            ventilator_oxygen_modality_flow_rate:
              currentRound.ventilator_oxygen_modality_flow_rate,
            ventilator_oxygen_modality_oxygen_rate:
              currentRound.ventilator_oxygen_modality_oxygen_rate,
            ventilator_peep: currentRound.ventilator_peep
              ? Number(currentRound.ventilator_peep)
              : null,
            ventilator_pip: currentRound.ventilator_pip,
            ventilator_pressure_support:
              currentRound.ventilator_pressure_support,
            ventilator_resp_rate: currentRound.ventilator_resp_rate,
            ventilator_spo2: currentRound.ventilator_spo2,
            ventilator_tidal_volume: currentRound.ventilator_tidal_volume,
          },
        }),
        {},
      );
    }
    return { graphData, graphDataCount };
  };

  if (!dailyRoundsList) {
    return <Loading />;
  }

  const dates = Object.keys(results).map((p: string) => formatDateTime(p));

  const getConditionAndLegend = (
    name: string,
    currentRound: DailyRoundsModel,
  ) => {
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
        legend =
          t(
            `OXYGEN_MODALITY__${currentRound.ventilator_oxygen_modality}_short`,
          ) +
          " (" +
          t("RESPIRATORY_SUPPORT_SHORT__OXYGEN_SUPPORT") +
          ")";
        break;
      case "INVASIVE":
        legend =
          t(`VENTILATOR_MODE__${currentRound.ventilator_mode}_short`) +
          " (" +
          t("RESPIRATORY_SUPPORT_SHORT__INVASIVE") +
          ")";
        break;
      case "NON_INVASIVE":
        legend =
          t(`VENTILATOR_MODE__${currentRound.ventilator_mode}_short`) +
          " (" +
          t("RESPIRATORY_SUPPORT_SHORT__NON_INVASIVE") +
          ")";
        break;
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

  const getMarkLineData = (name: string) => {
    const markLineData = [];
    if (!dailyRoundsList) return [];
    for (let index = 0; index < dailyRoundsList.length; index++) {
      const currentRound = dailyRoundsList[index];
      const { condition, legend } = getConditionAndLegend(name, currentRound);
      const currentInterfaceOrModality = getModeOrModality(currentRound);
      if (condition) {
        const startIndex = dates.findIndex(
          (element) => element == formatDateTime(currentRound.taken_at),
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
          markLineData.push({
            name: legend,
            xAxis: dates[startIndex],
            label: {
              show: true,
              position: "middle",
              formatter: "{b}",
              color: "#000000",
              textBorderColor: "#ffffff",
              textBorderWidth: 2,
            },
          });
        }
      }
    }
    return markLineData;
  };

  const yAxisData = (name: string) => {
    return Object.values(results).map((p: any) => p[name]);
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
            verticalMarkerData={getMarkLineData("ventilator_pip")}
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
            verticalMarkerData={getMarkLineData(
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
            verticalMarkerData={getMarkLineData("ventilator_resp_rate")}
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
            verticalMarkerData={getMarkLineData("ventilator_pressure_support")}
          />
        </div>
        <div className="rounded-lg border bg-white px-4 pt-4 shadow">
          <LinePlot
            title="Tidal Volume"
            name="Tidal Volume"
            xData={dates}
            yData={yAxisData("ventilator_tidal_volume")}
            verticalMarkerData={getMarkLineData("ventilator_tidal_volume")}
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
            verticalMarkerData={getMarkLineData("ventilator_peep")}
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
            verticalMarkerData={getMarkLineData("ventilator_fio2")}
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
            verticalMarkerData={getMarkLineData("ventilator_spo2")}
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
            verticalMarkerData={getMarkLineData("etco2")}
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
            verticalMarkerData={getMarkLineData(
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
            verticalMarkerData={getMarkLineData(
              "ventilator_oxygen_modality_flow_rate",
            )}
          />
        </div>
      </div>
    </div>
  );
};
