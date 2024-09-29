import { OperationAction, PTZPayload } from "./useOperateCamera";

import { Type } from "../../Redux/api";
import { UserBareMinimum } from "../Users/models";

export type GetStatusResponse = {
  result: {
    position: PTZPayload;
    moveStatus: {
      panTilt: "IDLE" | "MOVING";
      zoom: "IDLE" | "MOVING";
    };
    error: string;
    utcTime: string;
  };
};

export type GetStreamTokenResponse = {
  result: {
    token: string;
  };
};

export type GetPresetsResponse = {
  result: Record<string, number>;
};

export type GetLockCameraResponse = {
  result: {
    message: string;
    camera_user: UserBareMinimum;
  };
};

export type GetRequestAccessResponse = GetLockCameraResponse;

export const FeedRoutes = {
  operateAsset: {
    path: "/api/v1/asset/{id}/operate_assets/",
    method: "POST",
    TRes: Type<
      | GetStreamTokenResponse
      | GetStatusResponse
      | GetPresetsResponse
      | GetLockCameraResponse
      | GetRequestAccessResponse
    >(),
    TBody: Type<{ action: OperationAction }>(),
  },
} as const;
