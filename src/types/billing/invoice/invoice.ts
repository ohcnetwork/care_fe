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

export const INVOICE_STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  issued: "bg-blue-100 text-blue-800 border-blue-200",
  balanced: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
} as const;

export interface InvoiceBase {
  id: string;
  title: string;
  status: InvoiceStatus;
  cancelled_reason?: (typeof INVOICE_CANCEL_REASONS)[number] | null;
  payment_terms?: string | null;
  note?: string | null;
  issue_date?: string | null;
}

export interface InvoiceCreate extends Omit<InvoiceBase, "id"> {
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
