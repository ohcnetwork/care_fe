export interface VitalsDataBase {
  device_id: string;
  "date-time": string;
  "patient-id": string;
  "patient-name": string;
}

export interface VitalsValueBase {
  value: number;
  unit: string;
  interpretation: string;
  "low-limit": number;
  "high-limit": number;
}

export interface VitalsWaveformBase extends VitalsDataBase {
  observation_id: "waveform";
  resolution: string;
  "sampling rate": string;
  "data-baseline": number;
  "data-low-limit": number;
  "data-high-limit": number;
  data: string;
}
