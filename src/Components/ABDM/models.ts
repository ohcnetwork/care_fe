export interface ICreateHealthIdRequest {
  healthId?: string;
  // email: string;
  // firstName: string;
  // middleName: string;
  // lastName: string;
  // password: string;
  // profilePhoto: string;
  txnId: string;
  patientId?: string;
}

export interface ICreateHealthIdResponse {
  email?: string;
  firstName: string;
  lastName: string;
  healthId?: string;
  healthIdNumber: string;
}

export interface IHealthFacility {
  id: string;
  registered: boolean;
  external_id: string;
  created_date: string;
  modified_date: string;
  hf_id: string;
  facility: string;
  detail?: string;
}

export interface ILinkABHANumber {
  abha_profile: {
    abha_number: string;
    health_id: string;
    date_of_birth: string;
  };
}

export interface IConfirmMobileOtp {
  otp: string;
  txnId: string;
  patientId?: string;
  message?: string;
}

export interface IHealthId {
  authMethods?: string[];
}

export interface IAadhaarOtp {
  txnId: string;
}

export interface ICheckAndGenerateMobileOtp {
  mobileLinked: boolean;
  txnId: string;
}

export interface IAadhaarOtpTBody {
  aadhaar?: string;
  txnId?: string;
}

export interface IVerifyAadhaarOtpTBody {
  consultation?: string;
  name?: string;
  gender?: "M" | "F" | "O";
  dob?: string;
  otp?: string;
  txnId?: string;
}

export interface IGenerateMobileOtpTBody {
  mobile: string;
  txnId: string;
}

export interface ISearchByHealthIdTBody {
  healthId: string;
}

export interface IinitiateAbdmAuthenticationTBody {
  authMethod: string;
  healthid: string;
}

export interface IgetAbhaCardTBody {
  patient: string;
  type: "pdf" | "png";
}

export interface IcreateHealthFacilityTBody {
  facility: string;
  hf_id: string;
}

export interface IpartialUpdateHealthFacilityTBody {
  hf_id: string;
}
