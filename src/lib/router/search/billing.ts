import { z } from "zod";

import {
  paginationSearch,
  searchDate,
  searchEnum,
  searchString,
} from "@/lib/router/search/fields";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";

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
