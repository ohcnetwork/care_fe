import { HttpMethod, Type } from "@/Utils/request/types";
import {
  ConfirmPasswordResetOtpRequest,
  ConfirmPasswordResetOtpResponse,
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
  sendPasswordResetOtp: {
    path: "/api/v1/otp/password_reset/send/",
    method: HttpMethod.POST,
    noAuth: true,
    TBody: Type<SendOtpRequest>(),
    TRes: Type<SendOtpResponse>(),
  },
  confirmPasswordResetOtp: {
    path: "/api/v1/otp/password_reset/confirm/",
    method: HttpMethod.POST,
    noAuth: true,
    TBody: Type<ConfirmPasswordResetOtpRequest>(),
    TRes: Type<ConfirmPasswordResetOtpResponse>(),
  },
} as const;
