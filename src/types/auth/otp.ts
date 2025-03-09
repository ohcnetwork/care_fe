export interface TokenData {
  token: string;
  phoneNumber: string;
  createdAt: string;
}

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

export interface MFAResponse {
  temp_token: string;
}
