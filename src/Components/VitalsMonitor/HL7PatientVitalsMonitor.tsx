import { useEffect } from "react";
import useHL7VitalsMonitor from "./useHL7VitalsMonitor";
import { Link } from "raviger";
import { GENDER_TYPES } from "../../Common/constants";
import CareIcon from "../../CAREUI/icons/CareIcon";
import WaveformLabels from "./WaveformLabels";
import { classNames } from "../../Utils/utils";
import { IVitalsComponentProps, VitalsValueBase } from "./types";
import { triggerGoal } from "../Common/Plausible";
import useAuthUser from "../../Common/hooks/useAuthUser";

export default function HL7PatientVitalsMonitor(props: IVitalsComponentProps) {
  const { connect, waveformCanvas, data, isOnline } = useHL7VitalsMonitor(
    props.config
  );
  const { patient, bed, asset } = props.patientAssetBed ?? {};
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

  return (
    <div className="flex flex-col gap-1 rounded bg-[#020617] p-2">
      {props.patientAssetBed && (
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
              <span className="flex items-center gap-1 text-gray-500">
                <CareIcon className="care-l-ban" />
                No Patient
              </span>
            )}
            {patient && (
              <span className="text-xs font-bold text-gray-400 md:text-sm">
                {patient.age}y;{" "}
                {GENDER_TYPES.find((g) => g.id === patient.gender)?.icon}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs md:text-sm">
            {asset && (
              <Link
                className="flex items-center gap-1 text-gray-500"
                href={`/facility/${patient?.facility_object?.id}/assets/${asset?.id}`}
              >
                <CareIcon className="care-l-monitor-heart-rate text-sm md:text-base" />
                <span>{asset.name}</span>
              </Link>
            )}
            {bed && (
              <Link
                className="flex items-center gap-2 text-gray-500"
                href={`/facility/${patient?.facility_object?.id}/location/${bed?.location_object?.id}/beds`}
              >
                <span className="flex items-center gap-1">
                  <CareIcon className="care-l-bed text-sm md:text-base" />
                  <span>{bed.name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CareIcon className="care-l-location-point text-sm md:text-base" />
                  <span>{bed.location_object?.name}</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
      <div className="relative flex flex-col gap-2 md:flex-row md:justify-between">
        <VitalsNonWaveformContent>
          {/* Pulse Rate */}
          <NonWaveformData
            label="ECG"
            attr={data.pulseRate ?? data.heartRate}
            className="text-green-400"
            suffix={
              <span className="animate-pulse font-sans text-red-500">❤️</span>
            }
          />

          {/* Blood Pressure */}
          <div className="flex flex-col p-1">
            <div className="flex w-full gap-2 font-bold text-orange-500">
              <span className="text-sm">NIBP</span>
              <span className="text-xs">{data.bp?.systolic.unit ?? "--"}</span>
            </div>
            <div className="flex w-full justify-center text-sm font-medium text-orange-500">
              Sys / Dia
            </div>
            <div className="flex w-full justify-center text-2xl font-black text-orange-300 md:text-4xl">
              <span>{data.bp?.systolic.value ?? "--"}</span>
              <span>/</span>
              <span>{data.bp?.diastolic.value ?? "--"}</span>
            </div>
            <div className="flex items-end">
              <span className="flex-1 text-sm font-bold text-orange-500">
                Mean
              </span>
              <span className="flex-1 text-xl font-bold text-gray-300">
                {data.bp?.map.value ?? "--"}
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
                        data.temperature1?.value - data.temperature2?.value
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
              isOnline && "hidden"
            )}
            style={waveformCanvas.size}
          >
            <CareIcon className="care-l-cloud-times mb-2 animate-pulse text-4xl" />
            <span className="font-bold">No incoming data from HL7 Monitor</span>
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
    </div>
  );
}

export const VitalsNonWaveformContent = ({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) => (
  <div className="z-10 grid grid-cols-2 gap-x-8 gap-y-4 divide-blue-600 border-b border-blue-600 bg-[#020617] tracking-wider text-white md:absolute md:inset-y-0 md:right-0 md:grid-cols-1 md:gap-0 md:divide-y md:border-b-0 md:border-l">
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
