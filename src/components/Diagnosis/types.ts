import { PerformedByModel } from "../HCX/misc";

export type ICD11DiagnosisModel = {
  id: string;
  label: string;
  chapter?: string;
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
  readonly id: string;
  diagnosis?: ICD11DiagnosisModel["id"];
  readonly diagnosis_object: ICD11DiagnosisModel;
  verification_status: ConditionVerificationStatus;
  is_principal: boolean;
  readonly is_migrated: boolean;
  readonly created_by: PerformedByModel;
  readonly created_date: string;
  readonly modified_date: string;
}

export interface CreateDiagnosis {
  diagnosis: ICD11DiagnosisModel["id"];
  readonly diagnosis_object?: ICD11DiagnosisModel;
  verification_status: (typeof ActiveConditionVerificationStatuses)[number];
  is_principal: boolean;
}
