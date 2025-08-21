import { HttpMethod, Type } from "@/Utils/request/api";
import {
  CheckResetTokenRequest,
  ForgotPasswordRequest,
  JwtTokenObtainPair,
  LoginRequest,
  LoginResponse,
  PasswordResetResponse,
  ResetPasswordRequest,
  UpdatePasswordRequest,
} from "@/types/auth/auth";

import {
  MFALoginRequest,
  TOTPDisableRequest,
  TOTPSetupResponse,
  TOTPVerifyRequest,
  TOTPVerifyResponse,
} from "./otp";

export default {
  /**
   * Auth related APIs
   */
  login: {
    path: "/api/v1/auth/login/",
    method: HttpMethod.POST,
    noAuth: true,
    TRes: Type<LoginResponse>(),
    TBody: Type<LoginRequest>(),
  },
  logout: {
    path: "/api/v1/auth/logout/",
    method: HttpMethod.POST,
    TBody: Type<JwtTokenObtainPair>(),
    TRes: Type<void>(),
  },
  tokenRefresh: {
    path: "/api/v1/auth/token/refresh/",
    method: HttpMethod.POST,
    TRes: Type<JwtTokenObtainPair>(),
    TBody: Type<{ refresh: JwtTokenObtainPair["refresh"] }>(),
  },
  updatePassword: {
    path: "/api/v1/password_change/",
    method: HttpMethod.PUT,
    TRes: Type<PasswordResetResponse>(),
    TBody: Type<UpdatePasswordRequest>(),
  },

  forgotPassword: {
    path: "/api/v1/password_reset/",
    method: HttpMethod.POST,
    noAuth: true,
    TRes: Type<PasswordResetResponse>(),
    TBody: Type<ForgotPasswordRequest>(),
  },

  checkResetToken: {
    path: "/api/v1/password_reset/check/",
    method: HttpMethod.POST,
    noAuth: true,
    TBody: Type<CheckResetTokenRequest>(),
    TRes: Type<PasswordResetResponse>(),
  },

  resetPassword: {
    path: "/api/v1/password_reset/confirm/",
    method: HttpMethod.POST,
    noAuth: true,
    TBody: Type<ResetPasswordRequest>(),
    TRes: Type<PasswordResetResponse>(),
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
