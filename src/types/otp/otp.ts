// Matches the backend's OTP_LENGTH setting.
export const OTP_LENGTH = 5;

export interface TokenData {
  token: string;
  phoneNumber: string;
  createdAt: string;
}

export interface SendOtpRequest {
  phone_number: string;
}

export interface SendOtpResponse {
  otp: string; // "generated" on success
}

export interface LoginByOtpRequest {
  phone_number: string;
  otp: string;
}

export interface LoginByOtpResponse {
  access: string;
}

export interface ConfirmPasswordResetOtpRequest {
  phone_number: string;
  otp: string;
  password: string;
  username?: string;
}

export interface ConfirmPasswordResetOtpResponse {
  message: string;
}
