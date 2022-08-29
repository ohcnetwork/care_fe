import axios, { AxiosError, AxiosResponse } from "axios";

export interface IAsset {
  username: string;
  password: string;
  hostname: string;
  middlewareHostname: string;
  port: number;
}

interface PTZPayload {
  x: number;
  y: number;
  zoom: number;
}

export interface PTZState {
  x: number;
  y: number;
  zoom: number;
  precision: number;
}

interface UseMSEMediaPlayerOption {
  config: IAsset;
}

export interface ICameraAssetState {
  id: string;
  username: string;
  password: string;
  hostname: string;
  port: number;
}

export enum StreamStatus {
  Playing,
  Stop,
  Loading,
  Offline,
}

interface UseMSEMediaPlayerReturnType {
  absoluteMove: (payload: PTZPayload, options: IOptions) => void;
  relativeMove: (payload: PTZPayload, options: IOptions) => void;
  getPTZPayload: (
    action: PTZ,
    precision?: number,
    value?: number
  ) => PTZPayload;
  getCameraStatus: (options: IOptions) => void;
  getPresets: (options: IOptions) => void;
  gotoPreset: (payload: IGotoPresetPayload, options: IOptions) => void;
}

interface IOptions {
  onSuccess?: (resp: AxiosResponse) => void;
  onError?: (err: AxiosError) => void;
}

export enum PTZ {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
  ZoomIn = "zoomIn",
  ZoomOut = "zoomOut",
}

const getCameraStatus =
  (config: IAsset) =>
  (options: IOptions = {}) => {
    const { hostname, middlewareHostname, password, port, username } = config;
    axios
      .get(
        `https://${middlewareHostname}/status?hostname=${hostname}&port=${port}&username=${username}&password=${password}`
      )
      .then((resp: any) => options?.onSuccess && options.onSuccess(resp))
      .catch((err: any) => options?.onError && options.onError(err));
  };

const getPresets =
  (config: IAsset) =>
  (options: IOptions = {}) => {
    const { hostname, middlewareHostname, password, port, username } = config;
    axios
      .get(
        `https://${middlewareHostname}/presets?hostname=${hostname}&port=${port}&username=${username}&password=${password}`
      )
      .then((resp: any) => options?.onSuccess && options.onSuccess(resp))
      .catch((err: any) => options?.onError && options.onError(err));
  };

interface IGotoPresetPayload {
  preset: string;
}

const gotoPreset =
  (config: IAsset) =>
  (payload: IGotoPresetPayload, options: IOptions = {}) => {
    const { middlewareHostname } = config;
    axios
      .post(`https://${middlewareHostname}/gotoPreset`, {
        ...payload,
        ...config,
      })
      .then(
        (resp: AxiosResponse) => options?.onSuccess && options.onSuccess(resp)
      )
      .catch((err: AxiosError) => options?.onError && options.onError(err));
  };

const absoluteMove =
  (config: IAsset) =>
  (payload: PTZPayload, options: IOptions = {}) => {
    const { middlewareHostname } = config;
    axios
      .post(`https://${middlewareHostname}/absoluteMove`, {
        ...config,
        ...payload,
      })
      .then((resp: any) => options?.onSuccess && options.onSuccess(resp))
      .catch((err: any) => options?.onError && options.onError(err));
  };

const relativeMove =
  (config: IAsset) =>
  (payload: PTZPayload, options: IOptions = {}) => {
    const { middlewareHostname } = config;
    axios
      .post(`https://${middlewareHostname}/relativeMove`, {
        ...payload,
        ...config,
      })
      .then((resp: any) => options?.onSuccess && options.onSuccess(resp))
      .catch((err: any) => options?.onError && options.onError(err));
  };

export const getPTZPayload = (
  action: PTZ,
  precision = 1,
  value?: number
): PTZPayload => {
  let x = 0;
  let y = 0;
  let zoom = 0;
  const delta = !value ? 0.1 / Math.max(1, precision) : value;
  switch (action) {
    case PTZ.Up:
      y = delta;
      break;
    case PTZ.Down:
      y = -delta;
      break;
    case PTZ.Left:
      x = -delta;
      break;
    case PTZ.Right:
      x = delta;
      break;
    case PTZ.ZoomIn:
      zoom = delta;
      break;
    case PTZ.ZoomOut:
      zoom = -delta;
      break;
  }

  return { x, y, zoom };
};

export const useFeedPTZ = ({
  config,
}: UseMSEMediaPlayerOption): UseMSEMediaPlayerReturnType => {
  return {
    absoluteMove: absoluteMove(config),
    relativeMove: relativeMove(config),
    getPTZPayload,
    getCameraStatus: getCameraStatus(config),
    getPresets: getPresets(config),
    gotoPreset: gotoPreset(config),
  };
};
