import { HttpMethod, Type } from "@/Utils/request/api";
import {
  LoginByOtpRequest,
  LoginByOtpResponse,
  SendOtpRequest,
  SendOtpResponse,
} from "@/types/otp/otp";

export default {
  send: {
    path: "/api/v1/otp/send/",
    method: HttpMethod.POST,
    TBody: Type<SendOtpRequest>(),
    TRes: Type<SendOtpResponse>(),
  },
  login: {
    path: "/api/v1/otp/login/",
    method: HttpMethod.POST,
    TBody: Type<LoginByOtpRequest>(),
    TRes: Type<LoginByOtpResponse>(),
  },
} as const;
