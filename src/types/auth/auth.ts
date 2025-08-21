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

export type LoginResponse = JwtTokenObtainPair | MFAAuthenticationToken;

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

export type MFAMethod = "totp" | "backup";

export interface MFAOption {
  id: MFAMethod;
  label: string;
}

export interface PasswordRequest {
  password: string;
}

export interface TOTPSetupResponse {
  uri: string;
  secret_key: string;
}

export interface TOTPVerifyRequest {
  code: string;
}

export interface BackupCodesRespone {
  backup_codes: string[];
}

export interface MFALoginRequest {
  method: MFAMethod;
  code: string;
  temp_token: string;
}

export interface MFAAuthenticationToken {
  temp_token: string;
}
