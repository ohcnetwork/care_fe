import { PerformedByModel } from "../HCX/misc";

export type ICD11DiagnosisModel = {
  id: string;
  label: string;
};

export const ActiveConditionVerificationStatuses = [
  "unconfirmed",
  "provisional",
  "differential",
  "confirmed",
] as const;

export const InactiveConditionVerificationStatuses = [
  "refuted",
  "entered-in-error",
] as const;

export const ConditionVerificationStatuses = [
  ...ActiveConditionVerificationStatuses,
  ...InactiveConditionVerificationStatuses,
] as const;

export type ConditionVerificationStatus =
  (typeof ConditionVerificationStatuses)[number];

export interface ConsultationDiagnosis {
  id: string;
  diagnosis_object: ICD11DiagnosisModel;
  verification_status: ConditionVerificationStatus;
  is_principal: boolean;
  is_migrated: boolean;
  created_by: PerformedByModel;
  created_date: string;
  modified_date: string;
}

export interface CreateDiagnosis {
  diagnosis: ICD11DiagnosisModel["id"];
  diagnosis_object?: ICD11DiagnosisModel;
  verification_status: (typeof ActiveConditionVerificationStatuses)[number];
}

export interface ConsultationCreateDignosis extends CreateDiagnosis {
  is_principal: boolean;
}
