import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import BinaryChronologicalChart from "@/components/Facility/Consultations/components/BinaryChronologicalChart";
import { LinePlot } from "@/components/Facility/Consultations/components/LinePlot";
import { DailyRoundsModel } from "@/components/Patient/models";

import { formatDateTime } from "@/Utils/utils";

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

interface graphDataProps {
  [key: string]: {
    bilateral_air_entry?: boolean;
    etco2?: number;
    id?: string;
    ventilator_fio2?: number;
    ventilator_mean_airway_pressure?: number;
    ventilator_oxygen_modality_flow_rate?: number;
    ventilator_oxygen_modality_oxygen_rate?: number;
    ventilator_peep?: number | null;
    ventilator_pip?: number;
    ventilator_pressure_support?: number;
    ventilator_resp_rate?: number;
    ventilator_spo2?: number;
    ventilator_tidal_volume?: number;
  };
}

export const VentilatorPlot = ({
  dailyRoundsList,
}: {
  dailyRoundsList?: DailyRoundsModel[];
}) => {
  const [results, setResults] = useState<graphDataProps>({});
  const { t } = useTranslation();

  const getGraphData = (dailyRoundsData?: DailyRoundsModel[]) => {
    const graphData: graphDataProps = {};
    const graphDataCount = dailyRoundsData?.length ?? 0;
    if (dailyRoundsData) {
      dailyRoundsData.forEach((currentRound: DailyRoundsModel) => {
        // @ts-expect-error taken_at should always be available
        graphData[currentRound.taken_at] = {
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
          ventilator_pressure_support: currentRound.ventilator_pressure_support,
          ventilator_resp_rate: currentRound.ventilator_resp_rate,
          ventilator_spo2: currentRound.ventilator_spo2,
          ventilator_tidal_volume: currentRound.ventilator_tidal_volume,
        };
      });
    }
    return { graphData, graphDataCount };
  };

  useEffect(() => {
    const { graphData } = getGraphData(dailyRoundsList);
    setResults(graphData);
  }, [dailyRoundsList]);

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
          (currentRound.ventilator_interface === "INVASIVE" ||
            currentRound.ventilator_interface === "NON_INVASIVE") &&
          !!currentRound.ventilator_mode;
        break;
      case "ventilator_fio2":
        condition =
          currentRound.ventilator_interface === "OXYGEN_SUPPORT" &&
          currentRound.ventilator_oxygen_modality === "HIGH_FLOW_NASAL_CANNULA";
        break;
      case "ventilator_spo2":
        condition =
          currentRound.ventilator_interface === "OXYGEN_SUPPORT" &&
          (currentRound.ventilator_oxygen_modality === "NASAL_PRONGS" ||
            currentRound.ventilator_oxygen_modality === "SIMPLE_FACE_MASK" ||
            currentRound.ventilator_oxygen_modality ===
              "NON_REBREATHING_MASK" ||
            currentRound.ventilator_oxygen_modality ===
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
          currentRound.ventilator_interface === "OXYGEN_SUPPORT" &&
          (currentRound.ventilator_oxygen_modality === "NASAL_PRONGS" ||
            currentRound.ventilator_oxygen_modality === "SIMPLE_FACE_MASK" ||
            currentRound.ventilator_oxygen_modality === "NON_REBREATHING_MASK");
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
    if (!ventilatorInterface) return null;
    switch (ventilatorInterface) {
      case "INVASIVE":
      case "NON_INVASIVE":
        return round.ventilator_mode;
      case "OXYGEN_SUPPORT":
        return round.ventilator_oxygen_modality;
      default:
        return null;
    }
  };

  const getMarkLineData = (name: string) => {
    const markLineData = [];
    if (!dailyRoundsList) return [];
    let index = 0;
    while (index < dailyRoundsList.length) {
      const currentRound = dailyRoundsList[index];
      const { condition, legend } = getConditionAndLegend(name, currentRound);
      const currentInterfaceOrModality = getModeOrModality(currentRound);
      if (condition) {
        const startIndex = dates.findIndex(
          (element) => element === formatDateTime(currentRound.taken_at),
        );
        if (startIndex !== -1) {
          let nextIndex = index + 1;
          while (nextIndex < dailyRoundsList.length) {
            const nextRound = dailyRoundsList[nextIndex];
            const nextInterfaceOrModality = getModeOrModality(nextRound);
            if (
              currentRound.ventilator_interface ===
                nextRound.ventilator_interface &&
              currentInterfaceOrModality === nextInterfaceOrModality
            ) {
              nextIndex += 1;
            } else {
              break;
            }
          }
          const position =
            startIndex === 0 ? "insideMiddleBottom" : "insideMiddleTop";
          markLineData.push({
            name: legend,
            xAxis: dates[startIndex],
            label: {
              show: true,
              position,
              formatter: "{b}",
              color: "#000000",
              textBorderColor: "#ffffff",
              textBorderWidth: 2,
            },
          });
          index = nextIndex;
        } else {
          index += 1;
        }
      } else {
        index += 1;
      }
    }
    return markLineData;
  };

  const yAxisData = (name: keyof graphDataProps[string]) => {
    return Object.values(results).map((p) => p[name]);
  };

  const bilateral = Object.values(results)
    .map((p, i) => {
      return {
        value: p.bilateral_air_entry,
        timestamp: Object.keys(results)[i],
      };
    })
    .filter((p) => p.value !== null);

  return (
    <div>
      <div className="grid-row-1 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
          <LinePlot
            title="Tidal Volume"
            name="Tidal Volume"
            xData={dates}
            yData={yAxisData("ventilator_tidal_volume")}
            verticalMarkerData={getMarkLineData("ventilator_tidal_volume")}
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
          <BinaryChronologicalChart
            title="Bilateral Air Entry"
            data={bilateral}
            trueName="Yes"
            falseName="No"
          />
        </div>
        <div className="rounded-lg border bg-white p-4 shadow">
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
        <div className="rounded-lg border bg-white p-4 shadow">
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
