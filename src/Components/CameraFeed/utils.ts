import { MutableRefObject } from "react";
import { AssetClass, AssetData } from "../Assets/AssetTypes";
import { getCameraConfig } from "../../Utils/transformUtils";
import { isIOS } from "../../Utils/utils";

export const calculateVideoDelay = (
  ref: MutableRefObject<HTMLVideoElement | null>,
  playedOn?: Date,
) => {
  const video = ref.current;

  if (!video || !playedOn) {
    return 0;
  }

  const playedDuration = (new Date().getTime() - playedOn.getTime()) / 1e3;
  return playedDuration - video.currentTime;
};

export const getStreamUrl = (asset: AssetData) => {
  if (asset.asset_class !== AssetClass.ONVIF) {
    throw "getStreamUrl can be invoked only for ONVIF Assets";
  }

  const config = getCameraConfig(asset);
  const host = asset.resolved_middleware?.hostname;
  const uuid = config.accessKey;

  return isIOS
    ? `https://${host}/stream/${uuid}/channel/0/hls/live/index.m3u8?uuid=${uuid}&channel=0`
    : `wss://${host}/stream/${uuid}/channel/0/mse?uuid=${uuid}&channel=0`;
};
