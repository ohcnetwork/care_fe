import request from "../../Utils/request/request";
import { FeedRoutes } from "./routes";

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

export type OperationAction =
  | GetStatusOperation
  | GetPresetsOperation
  | GoToPresetOperation
  | AbsoluteMoveOperation
  | RelativeMoveOperation;

/**
 * This hook is used to control the PTZ of a camera asset and retrieve other related information.
 * @param id The external id of the camera asset
 */
export default function useOperateCamera(id: string, silent = false) {
  return (action: OperationAction) => {
    return request(FeedRoutes.operateAsset, {
      pathParams: { id },
      body: { action },
      silent,
    });
  };
}
