import { Type } from "../../Redux/api";
import { OperationAction, PTZPayload } from "./useOperateCamera";

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

export type GetPresetsResponse = {
  result: Record<string, number>;
};

export const FeedRoutes = {
  operateAsset: {
    path: "/api/v1/asset/{id}/operate_assets/",
    method: "POST",
    TRes: Type<GetStatusResponse | GetPresetsResponse>(),
    TBody: Type<{ action: OperationAction }>(),
  },
} as const;
