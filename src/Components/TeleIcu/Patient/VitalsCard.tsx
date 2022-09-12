import React, { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { listAssetBeds } from "../../../Redux/actions";
import { AssetData } from "../../Assets/AssetTypes";
import { PatientModel } from "../../Patient/models";
import Waveform, { WaveformType } from "./Waveform";

export interface ITeleICUPatientVitalsCardProps {
  patient: PatientModel;
}

const getVital = (
  patientObservations: any,
  vital: string,
  fallbackValue?: any
) => {
  if (patientObservations) {
    const vitalValues = patientObservations[vital];
    if (vitalValues) {
      const returnValue = vitalValues?.value;

      if (returnValue !== undefined && returnValue !== null) {
        return returnValue;
      }
    }
  }
  if (fallbackValue) {
    return fallbackValue;
  }
  return "";
};

export default function TeleICUPatientVitalsCard({
  patient,
}: ITeleICUPatientVitalsCardProps) {
  const wsClient = useRef<WebSocket>();

  const [waveform, setWaveForm] = useState<WaveformType | null>(null);

  const dispatch: any = useDispatch();
  const [hl7Asset, setHl7Asset] = React.useState<AssetData>();
  const [patientObservations, setPatientObservations] = React.useState<any>();

  const fetchData = async () => {
    if (patient?.last_consultation?.current_bed?.bed_object?.id) {
      let bedAssets = await dispatch(
        listAssetBeds({
          bed: patient.last_consultation?.current_bed?.bed_object?.id,
        })
      );
      bedAssets = {
        ...bedAssets,
        data: {
          ...bedAssets.data,
          results: bedAssets.data.results.filter((assetBed: any) =>
            assetBed.asset_object.meta?.asset_type === "HL7MONITOR"
              ? true
              : false
          ),
        },
      };
      if (bedAssets.data.results.length > 0) {
        setHl7Asset(bedAssets.data.results[0].asset_object);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [patient]);

  const connectWs = (url: string) => {
    wsClient.current = new WebSocket(url);
    wsClient.current.addEventListener("message", (e) => {
      const newObservations = JSON.parse(e.data || "{}");
      if (newObservations.length > 0) {
        setWaveForm(
          newObservations.filter((o: any) => o.observation_id === "waveform")[0]
        );
        const newObservationsMap = newObservations.reduce(
          (acc: any, curr: { observation_id: any }) => ({
            ...acc,
            [curr.observation_id]: curr,
          }),
          {}
        );
        setPatientObservations(newObservationsMap);
      }
    });
  };

  useEffect(() => {
    const url = hl7Asset?.meta?.local_ip_address
      ? `wss://${hl7Asset?.meta?.middleware_hostname}/observations/${hl7Asset?.meta?.local_ip_address}`
      : null;

    if (url) connectWs(url);

    return () => {
      wsClient.current?.close();
    };
  }, [hl7Asset?.meta?.local_ip_address, hl7Asset?.meta?.middleware_hostname]);

  useEffect(() => {
    return () => {
      wsClient.current?.close();
    };
  }, []);

  const vitals: [ReactNode, string, string | null][] = [
    [<>Pulse Rate</>, "pulse-rate", "pulse"],
    [<>Blood Pressure</>, "bp", "bp"],
    [
      <>
        SpO<sub>2</sub>
      </>,
      "SpO2",
      "ventilator_spo2",
    ],
    [<>R. Rate</>, "respiratory-rate", "resp"],
    [<>Temperature (F)</>, "body-temperature1", "temperature"],
  ];

  return (
    <div className=" w-full">
      <div className="flex w-full items-stretch flex-col md:flex-row">
        <div className="w-full flex items-stretch py-3 px-5 bg-black h-[50vw] md:h-auto text-gray-400">
          {waveform ? (
            <>
              <Waveform wave={waveform} color = {"red"} title={"ECG"} />
              <Waveform wave={waveform} color={"green"} title="BP"/>
              <Waveform wave={waveform} color={"yellow"} title="Temp"/>
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center w-[150px] text-gray-800">
                <i className="fas fa-plug-circle-exclamation text-4xl mb-4" />
                <div>No Live data at the moment!</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-row md:flex-col w-full md:w-[200px] border-l border-l-gray-400 p-3 justify-between md:justify-start shrink-0">
          {vitals.map((vital, i) => {
            const liveReading = getVital(patientObservations, vital[1]);
            return (
              <div key={i} className="p-2">
                <h2 className="font-bold text-xl md:text-3xl">
                  {liveReading ||
                    (vital[2] === "bp"
                      ? `${
                          patient.last_consultation?.last_daily_round?.bp
                            .systolic || "--"
                        }/${
                          patient.last_consultation?.last_daily_round?.bp
                            .diastolic || "--"
                        }`
                      : patient.last_consultation?.last_daily_round?.[
                          vital[2] || ""
                        ]) ||
                    "--"}
                </h2>
                <div className="text-xs md:text-base">
                  <i
                    className={`fas fa-circle text-xs mr-2 ${
                      liveReading ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                  {vital[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
