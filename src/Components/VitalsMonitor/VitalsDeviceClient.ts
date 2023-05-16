import { EventEmitter } from "events";

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
 * const device = new VitalsDeviceClient("wss://vitals-middleware.local/observations/192.168.1.14");
 *
 * device.on("SpO2", (observation) => {
 *  console.log(observation.value);
 * });
 */
class VitalsDeviceClient extends EventEmitter {
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

  on(event: EventName, listener: (data: VitalsData) => void): this {
    return super.on(event, listener);
  }

  emit(event: EventName, data: VitalsData): boolean {
    return super.emit(event, data);
  }

  once(event: EventName, listener: (data: VitalsData) => void): this {
    return super.once(event, listener);
  }

  off(event: EventName, listener: (data: VitalsData) => void): this {
    return super.off(event, listener);
  }
}

export default VitalsDeviceClient;

interface VitalsDataBase {
  device_id: string;
  "date-time": string;
  "patient-id": string;
  "patient-name": string;
}

export interface VitalsValue {
  value: number;
  unit: string;
  interpretation: string;
  "low-limit": number;
  "high-limit": number;
}

export interface VitalsValueData extends VitalsDataBase, VitalsValue {
  observation_id:
    | "heart-rate"
    | "ST"
    | "SpO2"
    | "pulse-rate"
    | "respiratory-rate"
    | "body-temperature1"
    | "body-temperature2";
}

export interface VitalsWaveformData extends VitalsDataBase {
  observation_id: "waveform";

  "wave-name": "II" | "Pleth" | "Respiration";
  resolution: string;
  "sampling rate": string;
  "data-baseline": number;
  "data-low-limit": number;
  "data-high-limit": number;
  data: string;
}

export interface VitalsBloodPressureData extends VitalsDataBase {
  observation_id: "blood-pressure";
  status: string;
  systolic: VitalsValue;
  diastolic: VitalsValue;
  map: VitalsValue;
}

export interface VitalsDeviceConnectionData extends VitalsDataBase {
  observation_id: "device-connection";
  status: "string";
}

export type VitalsData =
  | VitalsValueData
  | VitalsWaveformData
  | VitalsBloodPressureData
  | VitalsDeviceConnectionData;

type EventName =
  | VitalsData["observation_id"]
  | "ecg-waveform"
  | "pleth-waveform"
  | "spo2-waveform";

const parseObservations = (data: string) => {
  return JSON.parse(data || "[]") as VitalsData[];
};
