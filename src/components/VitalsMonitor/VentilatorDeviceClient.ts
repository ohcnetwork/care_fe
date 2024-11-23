import { EventEmitter } from "events";

import {
  VitalsDataBase,
  VitalsValueBase,
  VitalsWaveformBase,
} from "@/components/VitalsMonitor/types";

const WAVEFORM_KEY_MAP: Record<string, EventName> = {
  P: "pressure-waveform",
  F: "flow-waveform",
  V: "volume-waveform",
};

/**
 * Provides the API for connecting to the Vitals Monitor WebSocket and emitting
 * events for each observation.
 *
 * @example
 * const device = new VentilatorDeviceClient("wss://vitals-middleware.local/observations/192.168.1.14");
 *
 * device.on("FiO2", (observation) => {
 *  console.log(observation.value);
 * });
 */
class VentilatorDeviceClient extends EventEmitter {
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

  on(event: EventName, listener: (data: VentilatorData) => void): this {
    return super.on(event, listener);
  }

  emit(event: EventName, data: VentilatorData): boolean {
    return super.emit(event, data);
  }

  once(event: EventName, listener: (data: VentilatorData) => void): this {
    return super.once(event, listener);
  }

  off(event: EventName, listener: (data: VentilatorData) => void): this {
    return super.off(event, listener);
  }
}

export default VentilatorDeviceClient;

export interface VentilatorVitalsValueData
  extends VitalsDataBase,
    VitalsValueBase {
  observation_id: "Mode" | "PEEP" | "R.Rate" | "Insp-Time" | "FiO2";
}

export interface VentilatorVitalsWaveformData extends VitalsWaveformBase {
  "wave-name": "P" | "F" | "V";
}

export type VentilatorData =
  | VentilatorVitalsValueData
  | VentilatorVitalsWaveformData;

type EventName =
  | VentilatorData["observation_id"]
  | "pressure-waveform"
  | "flow-waveform"
  | "volume-waveform";

const parseObservations = (data: string) => {
  return JSON.parse(data || "[]") as VentilatorData[];
};
