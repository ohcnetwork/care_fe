import { Patient } from "@/types/emr/patient/patient";
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
  patient: Patient;
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

export const statusColorMap: Record<AccountStatus, string> = {
  active: "bg-green-100 text-green-900 border-green-200",
  inactive: "bg-gray-100 text-gray-900 border-gray-200",
  entered_in_error: "bg-red-100 text-red-900 border-red-200",
  on_hold: "bg-yellow-100 text-yellow-900 border-yellow-200",
};

export const billingStatusColorMap: Record<AccountBillingStatus, string> = {
  open: "bg-green-100 text-green-900 border-green-200",
  carecomplete_notbilled: "bg-gray-100 text-gray-900 border-gray-200",
  billing: "bg-gray-100 text-gray-900 border-gray-200",
  closed_baddebt: "bg-red-100 text-red-900 border-red-200",
  closed_voided: "bg-red-100 text-red-900 border-red-200",
  closed_completed: "bg-blue-100 text-blue-900 border-blue-200",
  closed_combined: "bg-blue-100 text-blue-900 border-blue-200",
};

export const closeBillingStatusColorMap: Partial<
  Record<AccountBillingStatus, string>
> = {
  closed_baddebt: "destructive",
  closed_voided: "destructive",
  closed_completed: "success",
  closed_combined: "success",
};
