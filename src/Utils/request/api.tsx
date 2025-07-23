import { PaginatedResponse } from "@/Utils/request/types";
import { AppointmentPatientRegister } from "@/pages/Patient/Utils";
import { MFAAuthenticationToken } from "@/types/auth/otp";
import { PatientRead } from "@/types/emr/patient/patient";
import { UserBase } from "@/types/user/user";

/**
 * A fake function that returns an empty object casted to type T
 * @returns Empty object as type T
 */
export function Type<T>(): T {
  return {} as T;
}

export interface JwtTokenObtainPair {
  access: string;
  refresh: string;
}

export type LoginResponse = JwtTokenObtainPair | MFAAuthenticationToken;

export interface LoginCredentials {
  username: string;
  password: string;
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
  // User Endpoints

  getScheduleAbleFacilityUser: {
    path: "/api/v1/facility/{facility_id}/schedulable_users/{user_id}/",
    TRes: Type<UserBase>(),
  },

  getScheduleAbleFacilityUsers: {
    path: "/api/v1/facility/{facility_id}/schedulable_users/",
    TRes: Type<PaginatedResponse<UserBase>>(),
  },

  //Profile

  getUserDetails: {
    path: "/api/v1/users/{username}/",
    method: "GET",
    TRes: Type<UserBase>(),
  },

  // OTP Routes
  otp: {
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
