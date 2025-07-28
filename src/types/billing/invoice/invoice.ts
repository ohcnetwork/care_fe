import { MonetaryComponent } from "@/types/base/monetaryComponent/monetaryComponent";
import { AccountRead } from "@/types/billing/account/Account";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { PaymentReconciliationRead } from "@/types/billing/paymentReconciliation/paymentReconciliation";

export enum InvoiceStatus {
  draft = "draft",
  issued = "issued",
  balanced = "balanced",
  cancelled = "cancelled",
  entered_in_error = "entered_in_error",
}

export const INVOICE_STATUS_COLORS = {
  draft: "secondary",
  issued: "blue",
  balanced: "green",
  cancelled: "destructive",
  entered_in_error: "destructive",
} as const;

export interface InvoiceBase {
  id: string;
  number: string;
  status: InvoiceStatus;
  cancelled_reason?: (typeof INVOICE_CANCEL_REASONS)[number];
  payment_terms?: string;
  note?: string;
  issue_date?: string;
}

export interface InvoiceCreate extends Omit<InvoiceBase, "id" | "number"> {
  account: string;
  charge_items: string[];
}

export interface InvoiceRead extends InvoiceBase {
  account: AccountRead;
  charge_items: ChargeItemRead[];
  total_price_components: MonetaryComponent[];
  total_net: number;
  total_gross: number;
  payment_reconciliations?: PaymentReconciliationRead[];
}

export interface InvoiceCancel {
  reason: string;
}

export const INVOICE_CANCEL_REASONS = [
  InvoiceStatus.cancelled,
  InvoiceStatus.entered_in_error,
] as const;
