import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  AccountBase,
  AccountCreate,
  AccountRead,
  AccountUpdate,
} from "./Account";

export default {
  listAccount: {
    path: "/api/v1/facility/{facilityId}/account/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<AccountBase>>(),
  },
  retrieveAccount: {
    path: "/api/v1/facility/{facilityId}/account/{accountId}/",
    method: HttpMethod.GET,
    TRes: Type<AccountRead>(),
  },
  createAccount: {
    path: "/api/v1/facility/{facilityId}/account/",
    method: HttpMethod.POST,
    TRes: Type<AccountRead>(),
    TBody: Type<AccountCreate>(),
  },
  updateAccount: {
    path: "/api/v1/facility/{facilityId}/account/{accountId}/",
    method: HttpMethod.PUT,
    TRes: Type<AccountRead>(),
    TBody: Type<AccountUpdate>(),
  },
  rebalanceAccount: {
    path: "/api/v1/facility/{facilityId}/account/{accountId}/rebalance/",
    method: HttpMethod.POST,
    TRes: Type<AccountRead>(),
  },
} as const;
