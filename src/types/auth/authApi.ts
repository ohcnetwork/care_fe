import { HttpMethod, Type } from "@/Utils/request/api";

export interface TOTPSetupResponse {
  uri: string;
  secret_key: string;
  backup_codes?: string[];
}

export interface TOTPVerifyRequest {
  code: string;
}

export interface TOTPVerifyResponse {
  backup_codes: string[];
}

export interface TOTPDisableRequest {
  password: string;
}

export interface MFALoginRequest {
  method: string;
  code: string;
  temp_token: string;
}

export interface MFALoginResponse {
  access: string;
  refresh: string;
}

export default {
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
      TRes: Type<MFALoginResponse>(),
    },
  },
} as const;
