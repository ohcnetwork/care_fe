import { useState } from "react";
import request from "../../Utils/request/request";
import { FeedRoutes } from "./routes";

export interface PTZPayload {
  x: number;
  y: number;
  zoom: number;
}

interface BaseOperation {
  type: string;
  options?: Record<string, unknown>;
}

interface GetStatusOperation extends BaseOperation {
  type: "get_status";
}

interface GetPresetsOperation extends BaseOperation {
  type: "get_presets";
}

interface GoToPresetOperation extends BaseOperation {
  type: "goto_preset";
  data: {
    preset: number;
  };
}

interface AbsoluteMoveOperation extends BaseOperation {
  type: "absolute_move";
  data: PTZPayload;
}

interface RelativeMoveOperation extends BaseOperation {
  type: "relative_move";
  data: PTZPayload;
  options?: {
    asset_bed_id?: string;
  };
}

interface GetStreamToken extends BaseOperation {
  type: "get_stream_token";
}

interface ResetFeedOperation extends BaseOperation {
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
export default function useOperateCamera(
  id: string,
  options?: Partial<Record<OperationAction["type"], Record<string, unknown>>>,
) {
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
              options: options?.get_status,
            },
          },
          silent: true,
        });
      }

      return request(FeedRoutes.operateAsset, {
        pathParams: { id },
        body: { action: { ...action, options: options?.[action.type] } },
        silent: true,
      });
    },
  };
}
