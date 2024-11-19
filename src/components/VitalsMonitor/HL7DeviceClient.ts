import { EventEmitter } from "events";

import {
  VitalsDataBase,
  VitalsValueBase,
  VitalsWaveformBase,
} from "@/components/VitalsMonitor/types";

const ECG_WAVENAME_KEYS = [
  "I",
  "II",
  "III",
  "aVR",
  "aVL",
  "aVF",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
] as const;

const WAVEFORM_KEY_MAP: Record<HL7VitalsWaveformData["wave-name"], EventName> =
  {
    Pleth: "pleth-waveform",
    Respiration: "spo2-waveform",

    // Maps each ECG wave name to the  event "ecg-waveform"
    ...(Object.fromEntries(
      ECG_WAVENAME_KEYS.map((key) => [key, "ecg-waveform"]),
    ) as Record<EcgWaveName, EventName>),
  };

/**
 * Provides the API for connecting to the Vitals Monitor WebSocket and emitting
 * events for each observation.
 *
 * @example
 * const device = new HL7DeviceClient("wss://vitals-middleware.local/observations/192.168.1.14");
 *
 * device.on("SpO2", (observation) => {
 *  console.log(observation.value);
 * });
 */
class HL7DeviceClient extends EventEmitter {
  constructor(socketUrl: string) {
    super();
    this.ws = new WebSocket(socketUrl);
  }

  ws: WebSocket;

  connect() {
    this.ws.addEventListener("message", (event) => {
      const observations = parseObservations(event.data);

      observations.forEach((observation) => {
        if (observation.observation_id === "waveform") {
          this.emit(WAVEFORM_KEY_MAP[observation["wave-name"]], observation);
        } else {
          this.emit(observation.observation_id, observation);
        }
      });
    });
  }

  disconnect() {
    this.ws.close();
  }

  on(event: EventName, listener: (data: HL7MonitorData) => void): this {
    return super.on(event, listener);
  }

  emit(event: EventName, data: HL7MonitorData): boolean {
    return super.emit(event, data);
  }

  once(event: EventName, listener: (data: HL7MonitorData) => void): this {
    return super.once(event, listener);
  }

  off(event: EventName, listener: (data: HL7MonitorData) => void): this {
    return super.off(event, listener);
  }
}

export default HL7DeviceClient;

export interface HL7VitalsValueData extends VitalsDataBase, VitalsValueBase {
  observation_id:
    | "heart-rate"
    | "ST"
    | "SpO2"
    | "pulse-rate"
    | "respiratory-rate"
    | "body-temperature1"
    | "body-temperature2";
}

type EcgWaveName = (typeof ECG_WAVENAME_KEYS)[number];

export interface HL7VitalsWaveformData extends VitalsWaveformBase {
  "wave-name": EcgWaveName | "Pleth" | "Respiration";
}

export interface HL7VitalsBloodPressureData extends VitalsDataBase {
  observation_id: "blood-pressure";
  status: string;
  systolic: VitalsValueBase;
  diastolic: VitalsValueBase;
  map: VitalsValueBase;
}

export interface HL7DeviceConnectionData extends VitalsDataBase {
  observation_id: "device-connection";
  status: "string";
}

export type HL7MonitorData =
  | HL7VitalsValueData
  | HL7VitalsWaveformData
  | HL7VitalsBloodPressureData
  | HL7DeviceConnectionData;

type EventName =
  | HL7MonitorData["observation_id"]
  | "ecg-waveform"
  | "pleth-waveform"
  | "spo2-waveform";

const parseObservations = (data: string) => {
  return JSON.parse(data || "[]") as HL7MonitorData[];
};
