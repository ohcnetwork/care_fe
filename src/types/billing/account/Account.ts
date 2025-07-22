import { PatientRead } from "@/types/emr/patient/patient";
import { Period } from "@/types/questionnaire/base";

export enum AccountStatus {
  active = "active",
  inactive = "inactive",
  entered_in_error = "entered_in_error",
  on_hold = "on_hold",
}

export enum AccountBillingStatus {
  open = "open",
  carecomplete_notbilled = "carecomplete_notbilled",
  billing = "billing",
  closed_baddebt = "closed_baddebt",
  closed_voided = "closed_voided",
  closed_completed = "closed_completed",
  closed_combined = "closed_combined",
}

export enum AccountAggregate {
  patient = "patient",
  insurance = "insurance",
  total = "total",
}

export interface AccountBalance {
  aggregate: AccountAggregate;
  amount: {
    value: number;
    currency: string;
  };
}

export interface AccountBase {
  id: string;
  status: AccountStatus;
  billing_status: AccountBillingStatus;
  name: string;
  service_period: Period;
  description?: string;
}

export interface AccountRead extends AccountBase {
  patient: PatientRead;
  calculated_at?: string;
  total_net: number;
  total_gross: number;
  total_paid: number;
  total_balance: number;
  created_date: string;
}

export interface AccountUpdate extends AccountBase {
  id: string;
  patient: string;
}

export interface AccountCreate extends Omit<AccountBase, "id"> {
  patient: string;
}

export const ACCOUNT_STATUS_COLORS = {
  active: "primary",
  inactive: "secondary",
  entered_in_error: "destructive",
  on_hold: "yellow",
} as const satisfies Record<AccountStatus, string>;

export const ACCOUNT_BILLING_STATUS_COLORS = {
  open: "green",
  carecomplete_notbilled: "secondary",
  billing: "secondary",
  closed_baddebt: "destructive",
  closed_voided: "destructive",
  closed_completed: "blue",
  closed_combined: "blue",
} as const satisfies Record<AccountBillingStatus, string>;

export const closeBillingStatusColorMap: Partial<
  Record<AccountBillingStatus, string>
> = {
  closed_baddebt: "destructive",
  closed_voided: "destructive",
  closed_completed: "success",
  closed_combined: "success",
};
