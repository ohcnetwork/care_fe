import { useEffect } from "react";
import useVitalsMonitor from "./useVitalsMonitor";
import { PatientModel } from "../Patient/models";
import { AssetBedModel } from "../Assets/AssetTypes";

interface Props {
  patient?: PatientModel;
  assetBed: AssetBedModel;
  socketUrl: string;
}

export default function PatientVitalsMonitor({ socketUrl }: Props) {
  const { connect, waveformCanvas, data } = useVitalsMonitor();

  useEffect(() => {
    connect(socketUrl);
  }, [socketUrl]);

  return (
    <div className="flex flex-col md:flex-row divide-y divide-x-0 md:divide-y-0 md:divide-x divide-blue-600 gap-2 bg-slate-950 p-2 rounded">
      <div className="relative" style={{ ...waveformCanvas.size }}>
        <canvas
          className="absolute top-0 left-0"
          ref={waveformCanvas.background.canvasRef}
          style={{ ...waveformCanvas.size }}
          {...waveformCanvas.size}
        />
        <canvas
          className="absolute top-0 left-0"
          ref={waveformCanvas.foreground.canvasRef}
          style={{ ...waveformCanvas.size }}
          {...waveformCanvas.size}
        />
      </div>
      <div className="grid grid-cols-3 md:grid-cols-1 md:divide-y divide-blue-600 text-white font-mono tracking-wider">
        {/* Pulse Rate */}
        <div className="flex justify-between items-center p-1">
          <div className="flex flex-col h-full items-start text-sm text-green-400 font-bold">
            <span>ECG</span>
            <span>{data.pulseRate?.unit ?? "--"}</span>
          </div>
          <span className="text-4xl md:text-6xl font-black text-gray-300">
            {data.pulseRate?.value ?? "--"}
          </span>
          {data.pulseRate !== undefined && (
            <span className="text-red-500 animate-pulse font-sans">❤️</span>
          )}
        </div>

        {/* Blood Pressure */}
        <div className="flex flex-col p-1">
          <div className="flex w-full gap-2 text-orange-500 font-bold">
            <span className="text-sm">NIBP</span>
            <span className="text-xs">{data.bp?.systolic.unit ?? "--"}</span>
          </div>
          <div className="flex w-full text-sm text-orange-500 font-medium justify-center">
            Sys / Dia
          </div>
          <div className="flex w-full text-orange-300 text-3xl md:text-5xl font-black justify-center">
            <span>{data.bp?.systolic.value ?? "--"}</span>
            <span>/</span>
            <span>{data.bp?.diastolic.value ?? "--"}</span>
          </div>
          <div className="flex items-end">
            <span className="flex-1 text-orange-500 font-bold text-sm">
              Mean
            </span>
            <span className="flex-1 text-gray-300 font-bold text-xl">
              {data.bp?.map.value ?? "--"}
            </span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="flex justify-between items-center p-1">
          <div className="flex gap-2 items-start h-full text-yellow-300 font-bold">
            <span className="text-sm">SpO2</span>
            <span className="text-xs">{data.spo2?.unit ?? "--"}</span>
          </div>
          <span className="text-4xl md:text-6xl font-black text-yellow-300 mr-3">
            {data.spo2?.value ?? "--"}
          </span>
        </div>

        {/* Respiratory Rate */}
        <div className="flex justify-between items-center p-1">
          <div className="flex flex-col items-start h-full text-sky-300 font-bold">
            <span className="text-sm">RESP</span>
            <span className="text-xs">
              {data.respiratoryRate?.unit ?? "--"}
            </span>
          </div>
          <span className="text-4xl md:text-6xl font-black text-sky-300 mr-3">
            {data.respiratoryRate?.value ?? "---"}
          </span>
        </div>

        {/* Temperature */}
        <div className="flex flex-col p-1 col-span-2 md:col-span-1">
          <div className="flex w-full gap-2 text-fuchsia-400 font-bold">
            <span className="text-sm">TEMP</span>
            <span className="text-xs">
              {data.temperature1?.unit?.replace("deg ", "°") ?? "--"}
            </span>
          </div>
          <div className="flex w-full gap-3 justify-between text-fuchsia-400">
            <div className="flex flex-col gap-1 justify-start">
              <span className="text-xs font-bold">T1</span>
              <span className="text-lg md:text-2xl font-black">
                {data.temperature1?.value ?? "--"}
              </span>
            </div>
            <div className="flex flex-col gap-1 justify-start">
              <span className="text-xs font-bold">T2</span>
              <span className="text-lg md:text-2xl font-black">
                {data.temperature2?.value ?? "--"}
              </span>
            </div>
            <div className="flex flex-col gap-1 justify-start">
              <span className="text-xs font-bold">TD</span>
              <span className="text-lg md:text-2xl font-black">
                {data.temperature1?.value && data.temperature2?.value
                  ? Math.abs(
                      data.temperature1!.value - data.temperature2!.value
                    )
                  : "--"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
