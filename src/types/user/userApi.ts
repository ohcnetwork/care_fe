import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  CreateServiceAccountResponse,
  CurrentUserRead,
  GenerateServiceAccountTokenResponse,
  GetServiceAccountsResponse,
  UserCreate,
  UserRead,
  UserReadMinimal,
  UserUpdate,
} from "@/types/user/user";

export default {
  list: {
    path: "/api/v1/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserReadMinimal>>(),
  },
  create: {
    path: "/api/v1/users/",
    method: HttpMethod.POST,
    TRes: Type<UserReadMinimal>(),
    TBody: Type<UserCreate>(),
  },
  get: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.GET,
    TRes: Type<UserRead>(),
  },
  update: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.PUT,
    TRes: Type<UserReadMinimal>(),
    TBody: Type<UserUpdate>(),
  },
  delete: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
    TBody: Type<void>(),
  },
  checkUsername: {
    path: "/api/v1/users/{username}/check_availability/",
    method: HttpMethod.GET,
    TRes: Type<void>(),
  },
  currentUser: {
    path: "/api/v1/users/getcurrentuser/",
    method: HttpMethod.GET,
    TRes: Type<CurrentUserRead>(),
  },
  uploadProfilePicture: {
    path: "/api/v1/users/{username}/profile_picture/",
    method: HttpMethod.POST,
    TRes: Type<void>(),
    TBody: Type<FormData>(),
  },
  deleteProfilePicture: {
    path: "/api/v1/users/{username}/profile_picture/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
    TBody: Type<void>(),
  },
  createServiceAccount: {
    path: "/api/v1/users/create_service_account/",
    method: HttpMethod.POST,
    TRes: Type<CreateServiceAccountResponse>(),
    TBody: Type<{ username: string; email: string }>(),
  },
  getServiceAccounts: {
    path: "/api/v1/users/get_service_accounts/",
    method: HttpMethod.GET,
    TRes: Type<GetServiceAccountsResponse[]>(),
  },
  generateServiceAccountToken: {
    path: "/api/v1/users/{username}/generate_service_account_token/",
    method: HttpMethod.POST,
    TRes: Type<GenerateServiceAccountTokenResponse>(),
  },
  revokeServiceAccountToken: {
    path: "/api/v1/users/{username}/revoke_service_account_token/",
    method: HttpMethod.DELETE,
    TRes: Type<void>(),
  },
} as const;
