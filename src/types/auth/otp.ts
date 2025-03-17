export interface TokenData {
  token: string;
  phoneNumber: string;
  createdAt: string;
}

export type MFAMethod = "totp" | "backup";

export interface MFAOption {
  id: MFAMethod;
  label: string;
}

export interface TOTPSetupResponse {
  uri: string;
  secret_key: string;
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

export interface MFAAuthenticationToken {
  temp_token: string;
}
