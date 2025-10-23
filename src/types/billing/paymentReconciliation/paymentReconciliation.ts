import { AccountRead } from "@/types/billing/account/Account";
import { InvoiceRead } from "@/types/billing/invoice/invoice";

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
  insurance = "insurance",
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

export interface PaymentReconciliationCreate
  extends Omit<PaymentReconciliationBase, "id"> {
  target_invoice?: string;
  account: string;
  is_credit_note?: boolean;
}

export type PaymentReconciliationUpdate = Omit<PaymentReconciliationBase, "id">;

export interface PaymentReconciliationRead extends PaymentReconciliationBase {
  target_invoice: InvoiceRead;
  account: AccountRead;
  is_credit_note: boolean;
}

export interface PaymentReconciliationCancel {
  reason: PaymentReconciliationStatus;
}
