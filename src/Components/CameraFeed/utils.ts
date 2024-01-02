import { MutableRefObject } from "react";
import { AssetData } from "../Assets/AssetTypes";
import { getCameraConfig } from "../../Utils/transformUtils";
import { isIOS } from "../../Utils/utils";

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

export const getStreamUrl = (asset: AssetData) => {
  const config = getCameraConfig(asset);
  const host = asset.resolved_middleware?.hostname;
  const uuid = config.accessKey;

  return isIOS
    ? `https://${host}/stream/${uuid}/channel/0/hls/live/index.m3u8?uuid=${uuid}&channel=0`
    : `wss://${host}/stream/${uuid}/channel/0/mse?uuid=${uuid}&channel=0`;
};
