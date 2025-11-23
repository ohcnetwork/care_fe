import { PaginatedResponse } from "@/Utils/request/types";
import {
  BatchRequestBody,
  BatchRequestResponse,
} from "@/types/base/batch/batch";
import { Code } from "@/types/base/code/code";
import { UserReadMinimal } from "@/types/user/user";

/**
 * A fake function that returns an empty object casted to type T
 * @returns Empty object as type T
 */
export function Type<T>(): T {
  return {} as T;
}

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export const API = <TResponse, TBody = undefined>(
  route: `${HttpMethod} ${string}`,
) => {
  const [method, path] = route.split(" ") as [HttpMethod, string];
  return {
    path,
    method,
    TRes: Type<TResponse>(),
    TBody: Type<TBody>(),
  };
};

/**
 * @deprecated use object specific api instead
 */
const routes = {
  getScheduleAbleFacilityUser: {
    path: "/api/v1/facility/{facility_id}/schedulable_users/{user_id}/",
    TRes: Type<UserReadMinimal>(),
  },

  getScheduleAbleFacilityUsers: {
    path: "/api/v1/facility/{facility_id}/schedulable_users/",
    TRes: Type<PaginatedResponse<UserReadMinimal>>(),
  },

  valueset: {
    expand: {
      path: "/api/v1/valueset/{system}/expand/",
      method: "POST",
      TBody: Type<{ search: string; count: number }>(),
      TRes: Type<{ results: Code[] }>(),
    },
  },

  batchRequest: {
    path: "/api/v1/batch_requests/",
    method: "POST",
    TRes: Type<{
      results: BatchRequestResponse[];
    }>(),
    TBody: Type<BatchRequestBody>(),
  },
} as const;

export default routes;
