import { Type } from "../../Redux/api";
import { ApiRoutes, PaginatedResponse } from "../../Utils/request/types";
import { HCXClaimModel } from "./models";

const HcxApis = {
  claims: {
    list: {
      path: "/api/v1/hcx/claim/",
      method: "GET",
      TRes: Type<PaginatedResponse<HCXClaimModel>>(),
    },

    create: {
      path: "/api/v1/hcx/claim/",
      method: "POST",
      TRes: Type<HCXClaimModel>(),
      TBody: Type<HCXClaimModel>(),
    },

    makeClaim: {
      path: "/api/v1/hcx/make_claim/",
      method: "POST",
      TRes: Type<unknown>(),
      TBody: Type<{ claim: string }>(),
    },
  } satisfies ApiRoutes,
} as const;

export default HcxApis;
