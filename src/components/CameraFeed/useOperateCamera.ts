import { useState } from "react";

import { FeedRoutes } from "@/components/CameraFeed/routes";

import request from "@/Utils/request/request";

export interface PTZPayload {
  x: number;
  y: number;
  zoom: number;
}

interface GetStatusOperation {
  type: "get_status";
}

interface GetPresetsOperation {
  type: "get_presets";
}

interface GoToPresetOperation {
  type: "goto_preset";
  data: {
    preset: number;
  };
}

interface AbsoluteMoveOperation {
  type: "absolute_move";
  data: PTZPayload;
}

interface RelativeMoveOperation {
  type: "relative_move";
  data: PTZPayload;
}

interface GetStreamToken {
  type: "get_stream_token";
}

interface ResetFeedOperation {
  type: "reset";
}

export type OperationAction =
  | GetStatusOperation
  | GetPresetsOperation
  | GoToPresetOperation
  | AbsoluteMoveOperation
  | RelativeMoveOperation
  | GetStreamToken
  | ResetFeedOperation;

/**
 * This hook is used to control the PTZ of a camera asset and retrieve other related information.
 * @param id The external id of the camera asset
 */
export default function useOperateCamera(id: string) {
  const [key, setKey] = useState(0);

  return {
    key,
    operate: (action: OperationAction) => {
      if (action.type === "reset") {
        setKey((prev) => prev + 1);

        return request(FeedRoutes.operateAsset, {
          pathParams: { id },
          body: {
            action: {
              type: "get_status",
            },
          },
          silent: true,
        });
      }

      return request(FeedRoutes.operateAsset, {
        pathParams: { id },
        body: { action },
        silent: true,
      });
    },
  };
}
