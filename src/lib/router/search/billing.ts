import { z } from "zod";

import {
  paginationSearch,
  searchAppPath,
  searchDate,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import { ChargeItemStatus } from "@/types/billing/chargeItem/chargeItem";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import {
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";

/** The invoice list: `InvoicesData`, on its own page and in an account. */
export const invoiceListSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchEnum(InvoiceStatus),
  patient: searchString(),
  patient_name: searchString(),
  created_by: searchString(),
  created_date_after: searchDate(),
  created_date_before: searchDate(),
});

export type InvoiceListSearch = z.output<typeof invoiceListSearch>;

/** The payment list: `PaymentsData`, on its own page and in an account. */
export const paymentListSearch = z.object({
  ...paginationSearch,
  ordering: searchString(),
  status: searchEnum(PaymentReconciliationStatus),
  reconciliation_type: searchEnum(PaymentReconciliationType),
  method: searchEnum(PaymentReconciliationPaymentMethod),
  location: searchString(),
  created_by: searchString(),
  created_by_username: searchString(),
  created_date_after: searchDate(),
  created_date_before: searchDate(),
});

export type PaymentListSearch = z.output<typeof paymentListSearch>;

/** The payments page: the payment list, of one account with `accountId`. */
export const paymentsPageSearch = paymentListSearch.extend({
  accountId: searchString(),
});

/**
 * The account list: on its own page and in the accounts tab of a patient.
 */
export const accountListSearch = z.object({
  ...paginationSearch,
  status: searchEnum(AccountStatus),
  billing_status: searchEnum(AccountBillingStatus),
  /** One of `careConfig.encounterClasses`. */
  encounter_class: searchString(),
  /** A date and time (`dateTimeQueryString`). */
  created_date_after: searchString(),
  created_date_before: searchString(),
  /** Comma-separated tag ids. */
  tags: searchString(),
  tags_behavior: searchString(),
  patient_filter: searchString(),
  patient_name: searchString(),
});

export type AccountListSearch = z.output<typeof accountListSearch>;

/** The charge items and bed charge items tabs of an account. */
export const chargeItemListSearch = z.object({
  ...paginationSearch,
  status: searchEnum(ChargeItemStatus),
  /** Comma-separated `ChargeItemServiceResource` values. */
  service_resource: searchString(),
  created_by: searchString(),
  created_date_after: searchString(),
  created_date_before: searchString(),
  ordering: searchString(),
  title: searchString(),
});

export type ChargeItemListSearch = z.output<typeof chargeItemListSearch>;

/**
 * The account page. Its tabs (invoices, charge items, bed charge items,
 * payments) share the query string, and some keys (`status`) hold different
 * values in each tab. The route reads these keys as strings; each tab parses
 * its own schema.
 */
export const accountShowSearch = z.object({
  ...paginationSearch,
  search: searchString(),
  status: searchString(),
  patient: searchString(),
  patient_name: searchString(),
  created_by: searchString(),
  created_by_username: searchString(),
  created_date_after: searchString(),
  created_date_before: searchString(),
  ordering: searchString(),
  title: searchString(),
  service_resource: searchString(),
  location: searchString(),
  method: searchString(),
  reconciliation_type: searchString(),
  /** Set by the account link of the encounter's account sheet. */
  encounterId: searchString(),
});

export type AccountShowSearch = z.output<typeof accountShowSearch>;

/** The printed charge items of an account. */
export const chargeItemPrintSearch = z.object({
  ordering: searchString(),
});

/** The billable charge items in the add charge items sheet of an invoice. */
export const invoiceChargeItemSearch = z.object({
  ...paginationSearch,
  search: searchString(),
});

/** The invoice page, with its add charge items sheet. */
export const invoiceShowSearch = invoiceChargeItemSearch.extend({
  /** The page that opened the invoice. The invoice page links back to it. */
  sourceUrl: searchAppPath(),
  /** Comma-separated ids of invoices that print with this one. */
  relatedInvoices: searchString(),
});
