import { EventEmitter } from "events";
import { VitalsDataBase, VitalsValueBase, VitalsWaveformBase } from "./types";

const WAVEFORM_KEY_MAP: Record<string, EventName> = {
  II: "ecg-waveform",
  Pleth: "pleth-waveform",
  Respiration: "spo2-waveform",
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

export interface HL7VitalsWaveformData extends VitalsWaveformBase {
  "wave-name": "II" | "Pleth" | "Respiration";
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
