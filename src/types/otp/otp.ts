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
