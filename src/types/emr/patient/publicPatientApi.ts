import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  PublicPatientCreate,
  PublicPatientRead,
} from "@/types/emr/patient/patient";

export default {
  create: {
    path: "/api/v1/otp/patient/",
    method: HttpMethod.POST,
    TBody: Type<PublicPatientCreate>(),
    TRes: Type<PublicPatientRead>(),
  },
  list: {
    path: "/api/v1/otp/patient/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<PublicPatientRead>>(),
  },
} as const;
