import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { CreateUserModel, UpdateUserModel, UserBase } from "@/types/user/user";

export default {
  list: {
    path: "/api/v1/users/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<UserBase>>(),
  },
  create: {
    path: "/api/v1/users/",
    method: HttpMethod.POST,
    TRes: Type<UserBase>(),
    TBody: Type<CreateUserModel>(),
  },
  get: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.GET,
    TRes: Type<UserBase>(),
  },
  checkUsername: {
    path: "/api/v1/users/{username}/check_availability/",
    method: HttpMethod.GET,
    TRes: Type<void>,
  },
  update: {
    path: "/api/v1/users/{username}/",
    method: HttpMethod.PUT,
    TRes: Type<UserBase>(),
    TBody: Type<Partial<UpdateUserModel>>(),
  },
} as const;
