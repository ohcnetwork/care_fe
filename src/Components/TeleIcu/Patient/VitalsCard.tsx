import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { listAssetBeds } from "../../../Redux/actions";
import { AssetData } from "../../Assets/AssetTypes";
import { PatientModel } from "../../Patient/models";
import { RightArrowIcon } from "../Icons/ArrowIcon";

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

  const dispatch: any = useDispatch();
  const [hl7Asset, setHl7Asset] = React.useState<AssetData>();
  const [patientObservations, setPatientObservations] = React.useState<any>();

  const fetchData = async () => {
    if (patient?.last_consultation?.current_bed?.bed) {
      let bedAssets = await dispatch(
        listAssetBeds({ bed: patient.last_consultation?.current_bed?.bed })
      );
      console.log("Found " + bedAssets?.data?.results?.length + "bedAssets:");
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
      console.log("Found " + bedAssets.data?.results?.length + "bedAssets:");
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
    const url = hl7Asset?.meta?.camera_address
      ? `wss://${hl7Asset?.meta?.middleware_hostname}/observations/${hl7Asset?.meta?.camera_address}`
      : null;

    if (url) connectWs(url);

    return () => {
      wsClient.current?.close();
    };
  }, [hl7Asset?.meta?.camera_address, hl7Asset?.meta?.middleware_hostname]);

  useEffect(() => {
    return () => {
      wsClient.current?.close();
    };
  }, []);

  return (
    <div className="lg:w-6/12 w-full p-5 py-3">
      <h4 className="flex items-center mb-2">
        <span className="font-semibold text-xl">Vitals</span>
        <span className="ml-2">
          <RightArrowIcon className="text-gray-900" />
        </span>
      </h4>
      <div className="grid grid-cols-2 gap-2 my-2">
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {getVital(
              patientObservations,
              "body-temperature1",
              patient.last_consultation?.last_daily_round?.temperature
                ? `${patient.last_consultation?.last_daily_round?.temperature} F`
                : "N/A"
            )}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            Temperature
            {getVital(patientObservations, "body-temperature1") ? (
              <span className="ml-2">
                <i className="fas fa-circle text-green-500" />
              </span>
            ) : (
              <span className="ml-2">
                <i className="fas fa-circle text-gray-500" />
              </span>
            )}
          </span>
        </div>
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {getVital(
              patientObservations,
              "pulse-rate",
              patient.last_consultation?.last_daily_round?.pulse
                ? `${patient.last_consultation?.last_daily_round?.pulse}`
                : "N/A"
            )}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            Pulse Rate
            {getVital(patientObservations, "pulse-rate") ? (
              <span className="ml-2">
                <i className="fas fa-circle text-green-500" />
              </span>
            ) : (
              <span className="ml-2">
                <i className="fas fa-circle text-gray-500" />
              </span>
            )}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 my-2">
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {getVital(
              patientObservations,
              "respiratory-rate",
              patient.last_consultation?.last_daily_round?.resp ?? "N/A"
            )}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            R. Rate
            {getVital(patientObservations, "respiratory-rate") ? (
              <span className="ml-2">
                <i className="fas fa-circle text-green-500" />
              </span>
            ) : (
              <span className="ml-2">
                <i className="fas fa-circle text-gray-500" />
              </span>
            )}
          </span>
        </div>
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {getVital(
              patientObservations,
              "SpO2",
              patient.last_consultation?.last_daily_round?.ventilator_spo2 ??
                "N/A"
            )}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            SpO<sub>2</sub>
            {getVital(patientObservations, "SpO2") ? (
              <span className="ml-2">
                <i className="fas fa-circle text-green-500" />
              </span>
            ) : (
              <span className="ml-2">
                <i className="fas fa-circle text-gray-500" />
              </span>
            )}
          </span>
        </div>
        <div className="bg-white rounded-md p-3 text-center">
          <h2 className="text-2xl md:text-4xl font-bold">
            {getVital(
              patientObservations,
              "heart-rate",
              patient.last_consultation?.last_daily_round?.pulse ?? "N/A"
            )}
          </h2>
          <span className="font-medium text-primary-900 md:text-lg text-sm">
            Heart Rate
            {getVital(patientObservations, "heart-rate") ? (
              <span className="ml-2">
                <i className="fas fa-circle text-green-500" />
              </span>
            ) : (
              <span className="ml-2">
                <i className="fas fa-circle text-gray-500" />
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
