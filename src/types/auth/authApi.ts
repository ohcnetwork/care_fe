import { HttpMethod, JwtTokenObtainPair, Type } from "@/Utils/request/api";

import {
  MFALoginRequest,
  TOTPDisableRequest,
  TOTPSetupResponse,
  TOTPVerifyRequest,
  TOTPVerifyResponse,
} from "./otp";

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
      TRes: Type<JwtTokenObtainPair>(),
    },
  },
} as const;
