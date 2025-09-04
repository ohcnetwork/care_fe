export enum RequestStatus {
  NOT_FOUND = "not_found",
  EXPIRED = "expired",
  OK = "ok",
}

export interface JwtTokenObtainPair {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenRefreshRequest {
  refresh: JwtTokenObtainPair["refresh"];
}

export type LoginResponse = JwtTokenObtainPair | MfaAuthenticationToken;

export interface ForgotPasswordRequest {
  username: string;
}

export interface CheckResetTokenRequest {
  token: string;
}

export interface PasswordResetResponse {
  detail?: string;
  status?: RequestStatus;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UpdatePasswordRequest {
  old_password: string;
  username: string;
  new_password: string;
}

/** MFA related types */

export type MfaMethod = "totp" | "backup";

export interface MfaOption {
  id: MfaMethod;
  label: string;
}

export interface PasswordRequest {
  password: string;
}

export interface TotpSetupResponse {
  uri: string;
  secret_key: string;
}

export interface TotpVerifyRequest {
  code: string;
}

export interface BackupCodesResponse {
  backup_codes: string[];
}

export interface MfaLoginRequest {
  method: MfaMethod;
  code: string;
  temp_token: string;
}

export interface MfaAuthenticationToken {
  temp_token: string;
}
