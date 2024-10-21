import { Type } from "../../Redux/api";
import { PaginatedResponse } from "../../Utils/request/types";
import { WritableOnly } from "../../Utils/types";
import { AssetBedModel } from "../Assets/AssetTypes";
import { PerformedByModel } from "../HCX/misc";
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

export type GetStreamTokenResponse = {
  result: {
    token: string;
  };
};

export type GetPresetsResponse = {
  result: Record<string, number>;
};

export type CameraPreset = {
  readonly id: string;
  name: string;
  readonly asset_bed: AssetBedModel;
  position: PTZPayload;
  readonly created_by: PerformedByModel;
  readonly updated_by: PerformedByModel;
  readonly created_date: string;
  readonly modified_date: string;
  readonly is_migrated: boolean;
};

export const FeedRoutes = {
  operateAsset: {
    path: "/api/v1/asset/{id}/operate_assets/",
    method: "POST",
    TRes: Type<
      GetStreamTokenResponse | GetStatusResponse | GetPresetsResponse
    >(),
    TBody: Type<{ action: OperationAction }>(),
  },

  listAssetBedPresets: {
    path: "/api/v1/assetbed/{assetbed_id}/camera_presets/",
    method: "GET",
    TRes: Type<PaginatedResponse<CameraPreset>>(),
  },
  listAssetPresets: {
    path: "/api/v1/asset/{asset_id}/camera_presets/",
    method: "GET",
    TRes: Type<PaginatedResponse<CameraPreset>>(),
  },
  listBedPresets: {
    path: "/api/v1/bed/{bed_id}/camera_presets/",
    method: "GET",
    TRes: Type<PaginatedResponse<CameraPreset>>(),
  },
  createPreset: {
    path: "/api/v1/assetbed/{assetbed_id}/camera_presets/",
    method: "POST",
    TRes: Type<CameraPreset>(),
    TBody: Type<WritableOnly<CameraPreset>>(),
  },
  updatePreset: {
    path: "/api/v1/assetbed/{assetbed_id}/camera_presets/{id}/",
    method: "PATCH",
    TRes: Type<CameraPreset>(),
    TBody: Type<Partial<WritableOnly<CameraPreset>>>(),
  },
  deletePreset: {
    path: "/api/v1/assetbed/{assetbed_id}/camera_presets/{id}/",
    method: "DELETE",
    TRes: Type<CameraPreset>(),
  },
} as const;
