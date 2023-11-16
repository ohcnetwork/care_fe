import { MutableRefObject } from "react";
import { PTZPayload } from "./useOperateCamera";
import { AssetData } from "../Assets/AssetTypes";
import { getCameraConfig } from "../../Utils/transformUtils";
import { isIOS } from "../../Utils/utils";

export type PTZAction = "up" | "down" | "left" | "right" | "zoomIn" | "zoomOut";

export const getPTZPayload = (
  action: PTZAction,
  precision = 1,
  value?: number
) => {
  let x = 0;
  let y = 0;
  let zoom = 0;

  const delta = value ?? 0.1 / Math.max(1, precision);

  switch (action) {
    case "up":
      y = delta;
      break;
    case "down":
      y = -delta;
      break;
    case "left":
      x = -delta;
      break;
    case "right":
      x = delta;
      break;
    case "zoomIn":
      zoom = delta;
      break;
    case "zoomOut":
      zoom = -delta;
      break;
  }

  return { x, y, zoom } as PTZPayload;
};

export const calculateVideoDelay = (
  ref: MutableRefObject<HTMLVideoElement | null>,
  playedOn?: Date
) => {
  const video = ref.current;

  if (!video || !playedOn) {
    return 0;
  }

  const playedDuration = (new Date().getTime() - playedOn.getTime()) / 1e3;
  return playedDuration - video.currentTime;
};

export const getStreamUrl = (asset: AssetData, fallbackMiddleware?: string) => {
  const config = getCameraConfig(asset);
  const host = config.middleware_hostname ?? fallbackMiddleware;
  const uuid = config.accessKey;

  return isIOS
    ? `https://${host}/stream/${uuid}/channel/0/hls/live/index.m3u8?uuid=${uuid}&channel=0`
    : `wss://${host}/stream/${uuid}/channel/0/mse?uuid=${uuid}&channel=0`;
};
