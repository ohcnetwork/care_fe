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

/** Pydantic-style validation error returned by `/api/v1/otp/send/`. */
export interface OtpError {
  type: string;
  loc: string[];
  msg: string;
  input: string;
  ctx: {
    error: string;
  };
  url: string;
}

/** Field-keyed error returned by `/api/v1/otp/login/`. */
export interface OtpValidationError {
  otp?: string;
  [key: string]: string | undefined;
}
