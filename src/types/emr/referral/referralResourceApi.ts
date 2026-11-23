import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  ReferralResource,
  ReferralResourceCreate,
  ResolvedReferralResource,
} from "./referralResource";

export default {
  list: {
    path: "/api/v1/referral/{referralId}/resources/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ReferralResource>>(),
  },
  create: {
    path: "/api/v1/referral/{referralId}/resources/",
    method: HttpMethod.POST,
    TBody: Type<ReferralResourceCreate>(),
    TRes: Type<ReferralResource>(),
  },
  delete: {
    path: "/api/v1/referral/{referralId}/resources/{resourceId}/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
  resolve: {
    path: "/api/v1/referral/{referralId}/resources/{resourceId}/resolve/",
    method: HttpMethod.GET,
    TRes: Type<ResolvedReferralResource>(),
  },
} as const;
