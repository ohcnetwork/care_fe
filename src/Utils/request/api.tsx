import { PaginatedResponse } from "@/Utils/request/types";
import { AppointmentPatientRegister } from "@/pages/Patient/Utils";
import {
  BatchRequestBody,
  BatchRequestResponse,
} from "@/types/base/batch/batch";
import { Code } from "@/types/base/code/code";
import { PatientRead } from "@/types/emr/patient/patient";
import { PlugConfig } from "@/types/plugConfig";
import {
  CommentModel,
  CreateResourceRequest,
  ResourceRequest,
  UpdateResourceRequest,
} from "@/types/resourceRequest/resourceRequest";
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

  // Request
  createResource: {
    path: "/api/v1/resource/",
    method: "POST",
    TRes: Type<ResourceRequest>(),
    TBody: Type<CreateResourceRequest>(),
  },
  updateResource: {
    path: "/api/v1/resource/{id}/",
    method: "PUT",
    TRes: Type<ResourceRequest>(),
    TBody: Type<UpdateResourceRequest>(),
  },
  listResourceRequests: {
    path: "/api/v1/resource/",
    method: "GET",
    TRes: Type<PaginatedResponse<ResourceRequest>>(),
  },
  getResourceDetails: {
    path: "/api/v1/resource/{id}/",
    method: "GET",
    TRes: Type<ResourceRequest>(),
  },
  getResourceComments: {
    path: "/api/v1/resource/{id}/comment/",
    method: "GET",
    TRes: Type<PaginatedResponse<CommentModel>>(),
  },
  addResourceComments: {
    path: "/api/v1/resource/{id}/comment/",
    method: "POST",
    TRes: Type<CommentModel>(),
    TBody: Type<Partial<CommentModel>>(),
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

  plugConfig: {
    listPlugConfigs: {
      path: "/api/v1/plug_config/",
      method: "GET",
      TRes: Type<{ configs: PlugConfig[] }>(),
    },
    getPlugConfig: {
      path: "/api/v1/plug_config/{slug}/",
      method: "GET",
      TRes: Type<PlugConfig>(),
    },
    createPlugConfig: {
      path: "/api/v1/plug_config/",
      method: "POST",
      TReq: Type<PlugConfig>(),
      TRes: Type<PlugConfig>(),
    },
    updatePlugConfig: {
      path: "/api/v1/plug_config/{slug}/",
      method: "PATCH",
      TReq: Type<PlugConfig>(),
      TRes: Type<PlugConfig>(),
    },
    deletePlugConfig: {
      path: "/api/v1/plug_config/{slug}/",
      method: "DELETE",
      TRes: Type<Record<string, never>>(),
      TBody: Type<void>(),
    },
  },

  // OTP Routes
  otp: {
    sendOtp: {
      path: "/api/v1/otp/send/",
      method: "POST",
      TBody: Type<{ phone_number: string }>(),
      TRes: Type<Record<string, never>>(),
      auth: {
        key: "Authorization",
        value: "{OTP_API_KEY}",
        type: "header",
      },
    },
    loginByOtp: {
      path: "/api/v1/otp/login/",
      method: "POST",
      TBody: Type<{ phone_number: string; otp: string }>(),
      TRes: Type<{ access: string }>(),
    },
    getPatient: {
      path: "/api/v1/otp/patient/",
      method: "GET",
      TRes: Type<PaginatedResponse<PatientRead>>(),
      auth: {
        key: "Authorization",
        value: "Bearer {token}",
        type: "header",
      },
    },
    createPatient: {
      path: "/api/v1/otp/patient/",
      method: "POST",
      TBody: Type<Partial<AppointmentPatientRegister>>(),
      TRes: Type<PatientRead>(),
      auth: {
        key: "Authorization",
        value: "Bearer {token}",
        type: "header",
      },
    },
  },
} as const;

export default routes;
