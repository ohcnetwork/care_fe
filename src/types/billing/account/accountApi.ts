import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

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
    defaultQueryParams: {
      ordering: "-created_date",
    },
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
  setTags: {
    path: "/api/v1/facility/{facilityId}/account/{external_id}/set_tags/",
    method: HttpMethod.POST,
    TRes: Type<AccountRead>(),
    TBody: Type<{ tags: string[] }>(),
  },
  removeTags: {
    path: "/api/v1/facility/{facilityId}/account/{external_id}/remove_tags/",
    method: HttpMethod.POST,
    TRes: Type<AccountRead>(),
    TBody: Type<{ tags: string[] }>(),
  },
  defaultAccount: {
    path: "/api/v1/facility/{facilityId}/account/default_account/",
    method: HttpMethod.POST,
    TRes: Type<AccountRead>(),
    TBody: Type<{ patient: string; facility: string; encounter: string }>(),
  },
} as const;
