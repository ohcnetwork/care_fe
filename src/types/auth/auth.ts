import { MFAAuthenticationToken } from "@/types/auth/otp";

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
