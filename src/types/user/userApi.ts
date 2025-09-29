import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  CurrentUserRead,
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
} as const;
