import { useEffect } from "react";
import useHL7VitalsMonitor from "./useHL7VitalsMonitor";
import { PatientAssetBed } from "../Assets/AssetTypes";
import { Link } from "raviger";
import { GENDER_TYPES } from "../../Common/constants";
import CareIcon from "../../CAREUI/icons/CareIcon";
import WaveformLabels from "./WaveformLabels";
import { classNames } from "../../Utils/utils";

interface Props {
  patientAssetBed?: PatientAssetBed;
  socketUrl: string;
  size?: { width: number; height: number };
}

export default function HL7PatientVitalsMonitor({
  patientAssetBed,
  socketUrl,
  size,
}: Props) {
  const { connect, waveformCanvas, data, isOnline } = useHL7VitalsMonitor();
  const { patient, bed } = patientAssetBed ?? {};

  useEffect(() => {
    connect(socketUrl);
  }, [socketUrl]);

  return (
    <div className="flex flex-col gap-1 bg-[#020617] p-2 rounded">
      {patientAssetBed && (
        <div className="flex items-center justify-between px-2 tracking-wide">
          <div className="flex items-center gap-2">
            {patient ? (
              <Link
                href={`/facility/${patient.last_consultation?.facility}/patient/${patient.id}/consultation/${patient.last_consultation?.id}`}
                className="font-bold uppercase text-white"
              >
                {patient?.name}
              </Link>
            ) : (
              <span className="flex gap-1 items-center text-gray-500">
                <CareIcon className="care-l-ban" />
                No Patient
              </span>
            )}
            {patient && (
              <span className="text-gray-400 font-bold text-sm">
                {patient.age}y;{" "}
                {GENDER_TYPES.find((g) => g.id === patient.gender)?.icon}
              </span>
            )}
          </div>
          {bed && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CareIcon className="care-l-bed text-base" />
                {bed.name}
              </span>
              <span className="flex items-center gap-1">
                <CareIcon className="care-l-location-point text-base" />
                {bed.location_object?.name}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:justify-between divide-y divide-x-0 md:divide-y-0 md:divide-x divide-blue-600 gap-2">
        <div
          className={classNames(
            "flex flex-col gap-1 justify-center items-center text-center p-1 text-warning-500 font-medium font-mono",
            isOnline && "hidden"
          )}
          style={{ ...(size ?? waveformCanvas.size) }}
        >
          <CareIcon className="care-l-cloud-times text-4xl animate-pulse mb-2" />
          <span className="font-bold">No incoming data from HL7 Monitor</span>
        </div>
        <div
          className={classNames("relative", !isOnline && "hidden")}
          style={{ ...(size ?? waveformCanvas.size) }}
        >
          <WaveformLabels
            labels={{
              ECG: "text-lime-300",
              ECG_CHANNEL_2: "invisible",
              Pleth: "text-yellow-300",
              Resp: "text-sky-300",
            }}
          />
          <canvas
            className="absolute top-0 left-0"
            ref={waveformCanvas.background.canvasRef}
            style={{ ...(size ?? waveformCanvas.size) }}
            {...waveformCanvas.size}
          />
          <canvas
            className="absolute top-0 left-0"
            ref={waveformCanvas.foreground.canvasRef}
            style={{ ...(size ?? waveformCanvas.size) }}
            {...waveformCanvas.size}
          />
        </div>
        <div className="z-50 bg-[#020617] grid grid-cols-3 md:grid-cols-1 md:divide-y divide-blue-600 text-white tracking-wider">
          {/* Pulse Rate */}
          <div className="flex justify-between items-center p-1">
            <div className="flex flex-col h-full items-start text-sm text-primary-400 font-bold">
              <span>ECG</span>
              <span>{(data.pulseRate ?? data.heartRate)?.unit ?? "--"}</span>
            </div>
            <span className="text-4xl md:text-6xl font-black text-gray-300">
              {(data.pulseRate ?? data.heartRate)?.value ?? "--"}
            </span>
            {(data.pulseRate ?? data.heartRate)?.value && (
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
            <div className="flex w-full text-orange-300 text-2xl md:text-4xl font-black justify-center">
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
    </div>
  );
}
