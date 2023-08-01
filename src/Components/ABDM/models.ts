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
