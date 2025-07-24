import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  CreateUserModel,
  UpdateUserModel,
  UserReadBase,
} from "@/types/user/user";

export default {
  list: {
    path: "/api/v1/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserReadBase>>(),
  },
  create: {
    path: "/api/v1/users/",
    method: HttpMethod.POST,
    TRes: Type<UserReadBase>(),
    TBody: Type<CreateUserModel>(),
  },
  get: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.GET,
    TRes: Type<UserReadBase>(),
  },
  checkUsername: {
    path: "/api/v1/users/{username}/check_availability/",
    method: HttpMethod.GET,
    TRes: Type<void>,
  },
  update: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.PUT,
    TRes: Type<UserReadBase>(),
    TBody: Type<Partial<UpdateUserModel>>(),
  },
} as const;
