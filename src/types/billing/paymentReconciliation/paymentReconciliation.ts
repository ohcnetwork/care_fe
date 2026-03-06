import { AccountRead } from "@/types/billing/account/Account";
import { InvoiceRead } from "@/types/billing/invoice/invoice";
import { LocationRead } from "@/types/location/location";
import { UserReadMinimal } from "@/types/user/user";

export enum PaymentReconciliationType {
  payment = "payment",
  adjustment = "adjustment",
  advance = "advance",
}

export enum PaymentReconciliationStatus {
  active = "active",
  cancelled = "cancelled",
  draft = "draft",
  entered_in_error = "entered_in_error",
}

export const PAYMENT_RECONCILIATION_STATUS_COLORS = {
  active: "primary",
  cancelled: "destructive",
  draft: "secondary",
  entered_in_error: "destructive",
} as const satisfies Record<PaymentReconciliationStatus, string>;

export enum PaymentReconciliationKind {
  deposit = "deposit",
  preriodic_payment = "preriodic_payment",
  online = "online",
  kiosk = "kiosk",
}

export enum PaymentReconciliationIssuerType {
  patient = "patient",
  insurer = "insurer",
}

export enum PaymentReconciliationOutcome {
  queued = "queued",
  complete = "complete",
  error = "error",
  partial = "partial",
}

export const PAYMENT_RECONCILIATION_OUTCOME_COLORS = {
  queued: "secondary",
  complete: "primary",
  error: "destructive",
  partial: "outline",
} as const satisfies Record<PaymentReconciliationOutcome, string>;

export enum PaymentReconciliationPaymentMethod {
  cash = "cash",
  ccca = "ccca",
  cchk = "cchk",
  cdac = "cdac",
  chck = "chck",
  ddpo = "ddpo",
  debc = "debc",
}

export const PAYMENT_RECONCILIATION_METHOD_MAP: Record<
  PaymentReconciliationPaymentMethod,
  string
> = {
  cash: "Cash",
  ccca: "Credit Card",
  cchk: "Credit Check",
  cdac: "Credit Account",
  chck: "Check",
  ddpo: "Direct Deposit",
  debc: "Debit Card",
};

export interface PaymentReconciliationBase {
  id: string;
  reconciliation_type: PaymentReconciliationType;
  status: PaymentReconciliationStatus;
  kind: PaymentReconciliationKind;
  issuer_type: PaymentReconciliationIssuerType;
  outcome: PaymentReconciliationOutcome;
  disposition?: string;
  payment_datetime?: string;
  method: PaymentReconciliationPaymentMethod;
  reference_number?: string;
  authorization?: string;
  tendered_amount?: string;
  returned_amount?: string;
  note?: string;
  amount: string;
}

export interface PaymentReconciliationCreate extends Omit<
  PaymentReconciliationBase,
  "id"
> {
  target_invoice?: string;
  account: string;
  is_credit_note?: boolean;
  location?: string;
  extensions?: Record<string, Record<string, unknown>>;
}

export type PaymentReconciliationUpdate = Omit<PaymentReconciliationBase, "id">;

export interface PaymentReconciliationRead extends PaymentReconciliationBase {
  target_invoice: InvoiceRead;
  account: AccountRead;
  is_credit_note: boolean;
  location: LocationRead | null;
  created_by: UserReadMinimal;
  updated_by: UserReadMinimal;
  created_date: string;
  modified_date: string;
  extensions?: Record<string, Record<string, unknown>>;
}

export interface PaymentReconciliationCancel {
  reason: PaymentReconciliationStatus;
}
