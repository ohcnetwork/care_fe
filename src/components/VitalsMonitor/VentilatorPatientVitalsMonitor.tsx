import { useEffect } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { VitalsNonWaveformContent } from "@/components/VitalsMonitor/HL7PatientVitalsMonitor";
import VitalsMonitorFooter from "@/components/VitalsMonitor/VitalsMonitorFooter";
import VitalsMonitorHeader from "@/components/VitalsMonitor/VitalsMonitorHeader";
import WaveformLabels from "@/components/VitalsMonitor/WaveformLabels";
import {
  IVitalsComponentProps,
  VitalsValueBase,
} from "@/components/VitalsMonitor/types";
import useVentilatorVitalsMonitor from "@/components/VitalsMonitor/useVentilatorVitalsMonitor";

import { classNames } from "@/Utils/utils";

export default function VentilatorPatientVitalsMonitor(
  props: IVitalsComponentProps,
) {
  const { connect, waveformCanvas, data, isOnline } =
    useVentilatorVitalsMonitor(props.config);

  useEffect(() => {
    connect(props.socketUrl);
  }, [props.socketUrl]);

  return (
    <div className="flex flex-col gap-1 rounded bg-[#020617] p-2">
      {props.hideHeader ? null : (
        <VitalsMonitorHeader patientAssetBed={props.patientAssetBed} />
      )}
      <div className="relative flex flex-col gap-2 divide-x-0 divide-y divide-blue-600 md:flex-row md:justify-between md:divide-x md:divide-y-0">
        <div>
          <div
            className={classNames(
              "flex flex-col items-center justify-center gap-1 p-1 text-center font-mono font-medium text-warning-500",
              isOnline && "hidden",
            )}
            style={waveformCanvas.size}
          >
            <CareIcon
              icon="l-cloud-times"
              className="mb-2 animate-pulse text-4xl"
            />
            <span className="font-bold">No incoming data from Ventilator</span>
          </div>
          <div
            className={classNames("relative", !isOnline && "hidden")}
            style={waveformCanvas.size}
          >
            <WaveformLabels
              labels={{
                Pressure: "text-lime-300",
                Flow: "text-yellow-300",
                Volume: "text-sky-300",
              }}
            />
            <canvas
              className="absolute left-0 top-0"
              ref={waveformCanvas.background.canvasRef}
              style={waveformCanvas.size}
              {...waveformCanvas.size}
            />
            <canvas
              className="absolute left-0 top-0"
              ref={waveformCanvas.foreground.canvasRef}
              style={waveformCanvas.size}
              {...waveformCanvas.size}
            />
          </div>
        </div>
        <VitalsNonWaveformContent>
          <NonWaveformData
            label="PEEP"
            attr={data.peep}
            className="text-orange-500"
          />
          <NonWaveformData
            label="R. Rate"
            attr={data.respRate}
            className="text-sky-300"
          />
          <NonWaveformData
            label="Insp-Time"
            attr={data.inspTime}
            className="text-fuchsia-400"
          />
          <NonWaveformData
            label="FiO2"
            attr={data.fio2}
            className="text-yellow-300"
          />
        </VitalsNonWaveformContent>
      </div>
      {props.hideFooter ? null : (
        <VitalsMonitorFooter asset={props.patientAssetBed?.asset} />
      )}
    </div>
  );
}

interface NonWaveformDataProps {
  label: string;
  attr?: VitalsValueBase;
  className?: string;
}

const NonWaveformData = ({ label, attr, className }: NonWaveformDataProps) => {
  return (
    <div
      className={classNames("flex items-center justify-between p-1", className)}
    >
      <div className="flex h-full flex-col items-start gap-1 font-bold">
        <span className="text-sm">{label}</span>
        <span className="text-xs">{attr?.unit ?? "--"}</span>
      </div>
      <span className="mr-3 text-4xl font-black md:text-6xl">
        {attr?.value ?? "--"}
      </span>
    </div>
  );
};
