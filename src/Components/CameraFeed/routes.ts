import { Type } from "../../Redux/api";
import { OperationAction } from "./useOperateCamera";

export const FeedRoutes = {
  operateAsset: {
    path: "/api/v1/asset/{id}/operate_assets/",
    method: "POST",
    TRes: Type<any>(),
    TBody: Type<{ action: OperationAction }>(),
  },
} as const;
