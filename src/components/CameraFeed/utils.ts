import { MutableRefObject } from "react";

import { AssetClass, AssetData } from "@/components/Assets/AssetTypes";

import { getCameraConfig } from "@/Utils/transformUtils";

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

export const getStreamUrl = (asset: AssetData, token?: string) => {
  if (asset.asset_class !== AssetClass.ONVIF) {
    throw "getStreamUrl can be invoked only for ONVIF Assets";
  }

  const config = getCameraConfig(asset.meta);
  const host = asset.resolved_middleware?.hostname;
  const uuid = config.accessKey;

  return `wss://${host}/stream/${uuid}/channel/0/mse?uuid=${uuid}&channel=0${token ? `&token=${token}` : ""}`;
};
