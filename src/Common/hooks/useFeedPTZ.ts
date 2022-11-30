import { operateAsset } from "../../Redux/actions";

export interface IAsset {
  id: string;
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
  dispatch: any;
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
  onSuccess?: (resp: Record<any, any>) => void;
  onError?: (resp: Record<any, any>) => void;
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
  (config: IAsset, dispatch: any) =>
  async (options: IOptions = {}) => {
    const resp = await dispatch(
      operateAsset(config.id, {
        action: {
          type: "get_status",
        },
      })
    );
    resp &&
      (resp.status === 200
        ? options?.onSuccess && options.onSuccess(resp.data.result)
        : options?.onError && options.onError(resp));
  };

const getPresets =
  (config: IAsset, dispatch: any) =>
  async (options: IOptions = {}) => {
    const resp = await dispatch(
      operateAsset(config.id, {
        action: {
          type: "get_presets",
        },
      })
    );
    resp &&
      (resp.status === 200
        ? options?.onSuccess && options.onSuccess(resp.data.result)
        : options?.onError && options.onError(resp));
  };

interface IGotoPresetPayload {
  preset: string;
}

const gotoPreset =
  (config: IAsset, dispatch: any) =>
  async (payload: IGotoPresetPayload, options: IOptions = {}) => {
    const resp = await dispatch(
      operateAsset(config.id, {
        action: {
          type: "goto_preset",
          data: payload,
        },
      })
    );
    resp &&
      (resp.status === 200
        ? options?.onSuccess && options.onSuccess(resp.data.result)
        : options?.onError && options.onError(resp));
  };

const absoluteMove =
  (config: IAsset, dispatch: any) =>
  async (payload: PTZPayload, options: IOptions = {}) => {
    const resp = await dispatch(
      operateAsset(config.id, {
        action: {
          type: "absolute_move",
          data: payload,
        },
      })
    );
    resp &&
      (resp.status === 200
        ? options?.onSuccess && options.onSuccess(resp.data.result)
        : options?.onError && options.onError(resp));
  };

const relativeMove =
  (config: IAsset, dispatch: any) =>
  async (payload: PTZPayload, options: IOptions = {}) => {
    const resp = await dispatch(
      operateAsset(config.id, {
        action: {
          type: "relative_move",
          data: payload,
        },
      })
    );
    resp &&
      (resp.status === 200
        ? options?.onSuccess && options.onSuccess(resp.data.result)
        : options?.onError && options.onError(resp));
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
  dispatch,
}: UseMSEMediaPlayerOption): UseMSEMediaPlayerReturnType => {
  return {
    absoluteMove: absoluteMove(config, dispatch),
    relativeMove: relativeMove(config, dispatch),
    getPTZPayload,
    getCameraStatus: getCameraStatus(config, dispatch),
    getPresets: getPresets(config, dispatch),
    gotoPreset: gotoPreset(config, dispatch),
  };
};
