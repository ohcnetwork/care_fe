import { AuthUserModel, UpdatePasswordForm } from "@/components/Users/models";

import { HttpMethod, LoginResponse, Type } from "@/Utils/request/api";
import { JwtTokenObtainPair } from "@/types/auth/types";

import {
  MFALoginRequest,
  TOTPDisableRequest,
  TOTPSetupResponse,
  TOTPVerifyRequest,
  TOTPVerifyResponse,
} from "./otp";

export default {
  getCurrentUser: {
    path: "/api/v1/users/getcurrentuser/",
    TRes: Type<AuthUserModel>(),
  },

  loginWithUsernamePassword: {
    path: "/api/v1/auth/login/",
    method: HttpMethod.POST,
    noAuth: true,
    TRes: Type<LoginResponse>(),
    TBody: Type<{ username: string; password: string }>(),
  },

  logout: {
    path: "/api/v1/auth/logout/",
    method: HttpMethod.POST,
    TBody: Type<JwtTokenObtainPair>(),
  },

  refreshAccessToken: {
    path: "/api/v1/auth/token/refresh/",
    method: HttpMethod.POST,
    TRes: Type<JwtTokenObtainPair>(),
    TBody: Type<{ refresh: JwtTokenObtainPair["refresh"] }>(),
  },

  verifyPasswordResetToken: {
    path: "/api/v1/password_reset/check/",
    method: HttpMethod.POST,
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{ token: string }>(),
  },

  confirmPasswordReset: {
    path: "/api/v1/password_reset/confirm/",
    method: HttpMethod.POST,
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{ password: string; confirm: string }>(),
  },

  requestPasswordReset: {
    path: "/api/v1/password_reset/",
    method: HttpMethod.POST,
    noAuth: true,
    TRes: Type<Record<string, never>>(),
    TBody: Type<{ username: string }>(),
  },

  updatePassword: {
    path: "/api/v1/password_change/",
    method: HttpMethod.PUT,
    TRes: Type<{ message: string }>(),
    TBody: Type<UpdatePasswordForm>(),
  },

  sendOtp: {
    path: "/api/v1/otp/send/",
    method: HttpMethod.POST,
    TBody: Type<{ phone_number: string }>(),
    TRes: Type<void>(),
    auth: {
      key: "Authorization",
      value: "{OTP_API_KEY}",
      type: "header",
    },
  },
  loginByOtp: {
    path: "/api/v1/otp/login/",
    method: HttpMethod.POST,
    TBody: Type<{ phone_number: string; otp: string }>(),
    TRes: Type<{ access: string }>(),
  },

  /**
   * TOTP (Time-based One-Time Password) related APIs
   */
  totp: {
    setup: {
      path: "/api/v1/mfa/totp/setup/",
      method: HttpMethod.POST,
      TRes: Type<TOTPSetupResponse>(),
    },
    verify: {
      path: "/api/v1/mfa/totp/verify/",
      method: HttpMethod.POST,
      TBody: Type<TOTPVerifyRequest>(),
      TRes: Type<TOTPVerifyResponse>(),
    },
    regenerateBackupCodes: {
      path: "/api/v1/mfa/totp/regenerate_backup_codes/",
      method: HttpMethod.POST,
      TRes: Type<{ backup_codes: string[] }>(),
    },
    disable: {
      path: "/api/v1/mfa/totp/disable/",
      method: HttpMethod.POST,
      TBody: Type<TOTPDisableRequest>(),
      TRes: Type<void>(),
    },
  },

  /**
   * MFA (Multi-Factor Authentication) related APIs
   */
  mfa: {
    login: {
      path: "/api/v1/mfa/login/",
      method: HttpMethod.POST,
      TBody: Type<MFALoginRequest>(),
      TRes: Type<JwtTokenObtainPair>(),
    },
  },
} as const;
