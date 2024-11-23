import dayjs from "dayjs";
import { useEffect } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import VitalsMonitorFooter from "@/components/VitalsMonitor/VitalsMonitorFooter";
import VitalsMonitorHeader from "@/components/VitalsMonitor/VitalsMonitorHeader";
import WaveformLabels from "@/components/VitalsMonitor/WaveformLabels";
import {
  IVitalsComponentProps,
  VitalsValueBase,
} from "@/components/VitalsMonitor/types";
import useHL7VitalsMonitor from "@/components/VitalsMonitor/useHL7VitalsMonitor";

import useAuthUser from "@/hooks/useAuthUser";

import { triggerGoal } from "@/Integrations/Plausible";
import { classNames } from "@/Utils/utils";

const minutesAgo = (timestamp: string) => {
  return `${dayjs().diff(dayjs(timestamp), "minute")}m ago`;
};

export default function HL7PatientVitalsMonitor(props: IVitalsComponentProps) {
  const { connect, waveformCanvas, data, isOnline } = useHL7VitalsMonitor(
    props.config,
  );
  const { bed, asset } = props.patientAssetBed ?? {};
  const authUser = useAuthUser();

  useEffect(() => {
    if (isOnline) {
      triggerGoal("Device Viewed", {
        bedId: bed?.id,
        assetId: asset?.id,
        userId: authUser.id,
      });
    }
  }, [isOnline]);

  useEffect(() => {
    connect(props.socketUrl);
  }, [props.socketUrl]);

  const bpWithinMaxPersistence = dayjs(data.bp?.["date-time"]).isAfter(
    props.patientCurrentBedAssignmentDate,
  );

  return (
    <div className="flex flex-col gap-1 rounded bg-[#020617] p-2">
      {props.hideHeader ? null : (
        <VitalsMonitorHeader patientAssetBed={props.patientAssetBed} />
      )}
      <div className="relative flex flex-col gap-2 md:flex-row md:justify-between">
        <VitalsNonWaveformContent>
          {/* Pulse Rate */}
          <NonWaveformData
            label="ECG"
            attr={data.pulseRate?.value ? data.pulseRate : data.heartRate}
            className="text-green-400"
            suffix={
              <span className="animate-pulse font-sans text-red-500">❤️</span>
            }
          />

          {/* Blood Pressure */}
          <div className="flex flex-col p-1">
            <div className="flex w-full justify-between gap-2 font-bold text-orange-500">
              <span className="text-sm">NIBP</span>
              <span className="text-xs">
                {bpWithinMaxPersistence
                  ? (data.bp?.systolic.unit ?? "--")
                  : "--"}
              </span>
              <span className="text-xs">
                {data.bp?.["date-time"] && minutesAgo(data.bp?.["date-time"])}
              </span>
            </div>
            <div className="flex w-full justify-center text-sm font-medium text-orange-500">
              Sys / Dia
            </div>
            <div className="flex w-full justify-center text-2xl font-black text-orange-300 md:text-4xl">
              <span>
                {bpWithinMaxPersistence
                  ? (data.bp?.systolic.value ?? "--")
                  : "--"}
              </span>
              <span>/</span>
              <span>
                {bpWithinMaxPersistence
                  ? (data.bp?.diastolic.value ?? "--")
                  : "--"}
              </span>
            </div>
            <div className="flex items-end">
              <span className="flex-1 text-sm font-bold text-orange-500">
                Mean
              </span>
              <span className="flex-1 text-xl font-bold text-secondary-300">
                {bpWithinMaxPersistence ? (data.bp?.map.value ?? "--") : "--"}
              </span>
            </div>
          </div>

          {/* SpO2 */}
          <NonWaveformData
            label="SpO2"
            attr={data.spo2}
            className="text-yellow-300"
          />

          {/* Respiratory Rate */}
          <NonWaveformData
            label="RESP"
            attr={data.respiratoryRate}
            className="text-sky-300"
          />

          {/* Temperature */}
          <div className="col-span-2 flex flex-col p-1 md:col-span-1">
            <div className="flex w-full gap-2 font-bold text-fuchsia-400">
              <span className="text-sm">TEMP</span>
              <span className="text-xs">
                {data.temperature1?.unit?.replace("deg ", "°") ?? "--"}
              </span>
            </div>
            <div className="flex w-full justify-between gap-3 text-fuchsia-400">
              <div className="flex flex-col justify-start gap-1">
                <span className="text-xs font-bold">T1</span>
                <span className="text-lg font-black md:text-2xl">
                  {data.temperature1?.value ?? "--"}
                </span>
              </div>
              <div className="flex flex-col justify-start gap-1">
                <span className="text-xs font-bold">T2</span>
                <span className="text-lg font-black md:text-2xl">
                  {data.temperature2?.value ?? "--"}
                </span>
              </div>
              <div className="flex flex-col justify-start gap-1">
                <span className="text-xs font-bold">TD</span>
                <span className="text-lg font-black md:text-2xl">
                  {data.temperature1?.value && data.temperature2?.value
                    ? Math.abs(
                        data.temperature1?.value - data.temperature2?.value,
                      )
                    : "--"}
                </span>
              </div>
            </div>
          </div>
        </VitalsNonWaveformContent>
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
              className="mb-2 animate-pulse text-4xl md:mr-36"
            />
            <span className="font-bold md:mr-36">
              No incoming data from HL7 Monitor
            </span>
          </div>
          <div
            className={classNames("relative", !isOnline && "hidden")}
            style={waveformCanvas.size}
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
      </div>
      {props.hideFooter ? null : <VitalsMonitorFooter asset={asset} />}
    </div>
  );
}

export const VitalsNonWaveformContent = ({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) => (
  <div className="z-[5] grid grid-cols-2 gap-x-8 gap-y-4 divide-blue-600 border-b border-blue-600 bg-[#020617] tracking-wider text-white md:absolute md:inset-y-0 md:right-0 md:grid-cols-1 md:gap-0 md:divide-y md:border-b-0 md:border-l">
    {children}
  </div>
);

interface NonWaveformDataProps {
  label: string;
  attr?: VitalsValueBase;
  className?: string;
  suffix?: JSX.Element;
}

const NonWaveformData = ({
  label,
  attr,
  className,
  suffix,
}: NonWaveformDataProps) => {
  return (
    <div
      className={classNames("flex items-center justify-between p-1", className)}
    >
      <div className="flex h-full flex-col items-start gap-1 font-bold">
        <span className="text-sm">{label}</span>
        <span className="text-xs">{attr?.unit ?? "--"}</span>
      </div>
      <span className="ml-4 mr-3 text-4xl font-black md:text-6xl">
        {attr?.value ?? "--"}
      </span>
      {attr?.value && suffix}
    </div>
  );
};
