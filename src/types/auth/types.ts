import { MFAAuthenticationToken } from "@/types/auth/otp";

export interface JwtTokenObtainPair {
  access: string;
  refresh: string;
}

export type LoginResponse = JwtTokenObtainPair | MFAAuthenticationToken;
