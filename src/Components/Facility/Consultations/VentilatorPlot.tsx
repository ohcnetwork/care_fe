import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { dailyRoundsAnalyse } from "../../../Redux/actions";
import { LinePlot } from "./components/LinePlot";

interface ITextLogsSubOption {
  date: string;
  value?: string;
}
interface ITextLogsData {
  ventilator_interface: ITextLogsSubOption[];
  ventilator_oxygen_modality: ITextLogsSubOption[];
  bilateral_air_entry: ITextLogsSubOption[];
}

const RenderTextLogs = ({
  data,
  label,
}: {
  data: ITextLogsSubOption[];
  label: string;
}) => {
  return (
    <>
      <div className="text-xl font-semibold mb-3">{label}</div>
      <div className="space-y-2">
        {data.map((log, index: number) => (
          <div key={index} className="flex">
            <div className="text-sm font-semibold w-44 ">{`- ${moment(
              log.date
            ).format("LLL")}`}</div>
            <div className="text-cool-gray-800 pl-2">{log.value ?? "---"}</div>
          </div>
        ))}
      </div>
    </>
  );
};

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
              "ventilator_interface",
              "ventilator_oxygen_modality",
              "bilateral_air_entry",
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
  const textLogsData = Object.entries(results).reduce<ITextLogsData>(
    (acc, cur) => {
      const [key, value] = cur as any;

      acc.ventilator_interface.push({
        date: key,
        value: value.ventilator_interface,
      });
      acc.ventilator_oxygen_modality.push({
        date: key,
        value: value.ventilator_oxygen_modality,
      });
      acc.bilateral_air_entry.push({
        date: key,
        value: value.bilateral_air_entry,
      });

      return acc;
    },
    {
      ventilator_interface: [],
      ventilator_oxygen_modality: [],
      bilateral_air_entry: [],
    }
  );

  return (
    <div className="grid grid-row-1 md:grid-cols-2 gap-4 mb-4">
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
      <div className="p-4  bg-white border rounded-lg shadow">
        <RenderTextLogs
          data={textLogsData.ventilator_interface}
          label={"Ventilator Interface"}
        />
      </div>
      <div className="p-4  bg-white border rounded-lg shadow">
        <RenderTextLogs
          data={textLogsData.ventilator_oxygen_modality}
          label={"Ventilator Oxygen Modality"}
        />
      </div>
      <div className="p-4  bg-white border rounded-lg shadow">
        <RenderTextLogs
          data={textLogsData.bilateral_air_entry}
          label={"Bilateral"}
        />
      </div>
    </div>
  );
};
