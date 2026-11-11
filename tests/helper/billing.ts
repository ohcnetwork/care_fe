import { expect, type Page } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

/**
 * API seeding helpers for billing specs (accounts, charge items, invoices,
 * payments). Billing states such as "billed" or "payment against an invoice"
 * need several chained calls, so specs seed them here and drive the UI only
 * for the behaviour under test.
 */

export interface SeededAccount {
  id: string;
  name: string;
}

export interface SeededResource {
  id: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} — ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export function createAccount(
  facilityId: string,
  patientId: string,
  opts: { name: string; status?: string; billing_status?: string },
): Promise<SeededAccount> {
  return post(`/api/v1/facility/${facilityId}/account/`, {
    name: opts.name,
    status: opts.status ?? "active",
    billing_status: opts.billing_status ?? "open",
    patient: patientId,
    service_period: { start: new Date().toISOString() },
  });
}

export function createChargeItem(
  facilityId: string,
  opts: {
    patientId: string;
    accountId: string;
    title: string;
    status?: string;
    amount?: string;
  },
): Promise<SeededResource> {
  return post(`/api/v1/facility/${facilityId}/charge_item/`, {
    title: opts.title,
    status: opts.status ?? "billable",
    quantity: "1",
    unit_price_components: [
      { monetary_component_type: "base", amount: opts.amount ?? "100" },
    ],
    patient: opts.patientId,
    account: opts.accountId,
  });
}

/** Creates a draft invoice; the backend marks its charge items as billed. */
export function createInvoice(
  facilityId: string,
  opts: { accountId: string; chargeItemIds: string[] },
): Promise<SeededResource> {
  return post(`/api/v1/facility/${facilityId}/invoice/`, {
    status: "draft",
    account: opts.accountId,
    charge_items: opts.chargeItemIds,
  });
}

export function createPayment(
  facilityId: string,
  opts: {
    accountId: string;
    amount: string;
    status?: string;
    reconciliationType?: string;
    targetInvoiceId?: string;
  },
): Promise<SeededResource> {
  return post(`/api/v1/facility/${facilityId}/payment_reconciliation/`, {
    account: opts.accountId,
    target_invoice: opts.targetInvoiceId,
    reconciliation_type: opts.reconciliationType ?? "advance",
    status: opts.status ?? "active",
    kind: "deposit",
    issuer_type: "patient",
    outcome: "complete",
    method: "cash",
    payment_datetime: new Date().toISOString(),
    tendered_amount: opts.amount,
    returned_amount: "0",
    is_credit_note: false,
  });
}

/**
 * Serves the facility with the given permissions removed, so a spec can
 * assert the UI for a user who lacks them. Superusers bypass facility
 * permissions entirely, so pair this with a non-superuser storage state.
 */
export async function withoutFacilityPermissions(
  page: Page,
  facilityId: string,
  permissions: string[],
) {
  await page.route(`**/api/v1/facility/${facilityId}/`, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const response = await route.fetch();
    const facility = await response.json();
    expect(Array.isArray(facility.permissions)).toBe(true);
    facility.permissions = facility.permissions.filter(
      (permission: string) => !permissions.includes(permission),
    );
    await route.fulfill({ response, json: facility });
  });
}
