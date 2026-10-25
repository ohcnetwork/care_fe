import { HttpMethod, Type } from "@/Utils/request/types";
import { ReferralRead } from "./referral";

export interface ReferralReferencesResponse {
  count: number;
  results: ReferralRead[];
}

export default {
  list: {
    path: "/api/v1/referral/{referralId}/referenced_by/",
    method: HttpMethod.GET,
    TRes: Type<ReferralReferencesResponse>(),
  },
} as const;
