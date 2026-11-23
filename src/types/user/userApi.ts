import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";
import {
  CurrentUserRetrieveSpec,
  GenerateServiceAccountTokenResponse,
  UserCreateSpec,
  UserQualificationDegree,
  UserRetrieveSpec,
  UserSpec,
  UserUpdateSpec,
} from "@/types/user/user";
import { UserPreferenceRequest } from "@/types/user/userPreferences";

export default {
  degrees: {
    path: "/api/v1/users/degrees/",
    method: HttpMethod.GET,
    TRes: Type<UserQualificationDegree[]>(),
  },
  list: {
    path: "/api/v1/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserSpec>>(),
  },
  create: {
    path: "/api/v1/users/",
    method: HttpMethod.POST,
    TRes: Type<UserSpec>(),
    TBody: Type<UserCreateSpec>(),
  },
  get: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.GET,
    TRes: Type<UserRetrieveSpec>(),
  },
  update: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.PUT,
    TRes: Type<UserSpec>(),
    TBody: Type<UserUpdateSpec>(),
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
    TRes: Type<CurrentUserRetrieveSpec>(),
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
  setPreferences: {
    path: "/api/v1/users/set_preferences/",
    method: HttpMethod.POST,
    TRes: Type<CurrentUserRetrieveSpec>(),
    TBody: Type<UserPreferenceRequest>(),
  },
} as const;
