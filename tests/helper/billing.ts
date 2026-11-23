import { faker } from "@faker-js/faker";
import {
  expect,
  test,
  type APIRequestContext,
  type APIResponse,
  type Locator,
  type Page,
} from "@playwright/test";
import { createTestPatient } from "tests/helper/patient";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

/**
 * Billing helpers: API seeders for accounts, charge items, invoices and
 * payments, and UI step functions for the billing capabilities a workflow
 * chains (create account → add charge items → create invoice → record
 * payment). Billing states such as "billed" or "payment against an invoice"
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

async function send<T>(
  method: "POST" | "PATCH",
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `${method} ${path} failed: ${res.status} — ${await res.text()}`,
    );
  }
  return (await res.json()) as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return send("POST", path, body);
}

async function read<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), await response.text()).toBe(true);
  return response.json() as Promise<T>;
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

/** Issues a draft invoice through the API, as the invoice page's Issue Invoice button does. */
export function issueInvoiceViaApi(input: {
  facilityId: string;
  invoiceId: string;
}): Promise<SeededResource> {
  return send(
    "PATCH",
    `/api/v1/facility/${input.facilityId}/invoice/${input.invoiceId}/`,
    { status: "issued", issue_date: new Date().toISOString() },
  );
}

export interface SeededInvoice {
  patientId: string;
  accountId: string;
  chargeItemId: string;
  chargeItemTitle: string;
  invoiceId: string;
}

/**
 * Seeds a fresh patient with an account, one billable charge item and an
 * invoice for it (draft, or issued with `issue: true`), so invoice list and
 * invoice page specs do not depend on invoices other specs leave behind.
 */
export async function seedInvoiceViaApi(input: {
  facilityId: string;
  issue?: boolean;
  namePrefix?: string;
}): Promise<SeededInvoice> {
  const { facilityId } = input;
  const prefix = input.namePrefix ?? "Invoice Seed";
  const suffix = faker.string.alphanumeric(8);
  const patientId = await createTestPatient(prefix);
  const account = await createAccount(facilityId, patientId, {
    name: `${prefix} account ${suffix}`,
  });
  const chargeItemTitle = `${prefix} item ${suffix}`;
  const chargeItem = await createChargeItem(facilityId, {
    patientId,
    accountId: account.id,
    title: chargeItemTitle,
  });
  const invoice = await createInvoice(facilityId, {
    accountId: account.id,
    chargeItemIds: [chargeItem.id],
  });
  if (input.issue) {
    await issueInvoiceViaApi({ facilityId, invoiceId: invoice.id });
  }
  return {
    patientId,
    accountId: account.id,
    chargeItemId: chargeItem.id,
    chargeItemTitle,
    invoiceId: invoice.id,
  };
}

export interface QuickAddPackage {
  groupId: string;
  packageId: string;
  packageName: string;
  definitionTitle: string;
  definitionSlug: string;
}

/**
 * Seeds what the Quick Add sheet offers: a tag group, a package tag under it,
 * and an active charge item definition tagged with the package.
 */
export async function createQuickAddPackageViaApi(input: {
  request: APIRequestContext;
  facilityId: string;
  /** Prefix of the group, package and definition names. */
  label?: string;
  /** Base price of the definition. */
  amount?: string;
}): Promise<QuickAddPackage> {
  const { request, facilityId } = input;
  const label = input.label ?? "Keyboard";
  const headers = getApiHeaders();
  const api = getApiUrl();
  const stamp = faker.string.alphanumeric(10);
  const tag = {
    resource: "charge_item_definition",
    facility: facilityId,
    category: "admin",
    status: "active",
    description: "Quick Add keyboard regression",
    priority: -1000,
  };
  const group = await read<{ id: string }>(
    await request.post(`${api}/api/v1/tag_config/`, {
      headers,
      data: { ...tag, display: `${label} group ${stamp}` },
    }),
  );
  const packageName = `${label} package ${stamp}`;
  const pack = await read<{ id: string }>(
    await request.post(`${api}/api/v1/tag_config/`, {
      headers,
      data: { ...tag, display: packageName, parent: group.id },
    }),
  );
  const definitionTitle = `${label} charge ${stamp}`;
  const definition = await read<{ slug: string }>(
    await request.post(
      `${api}/api/v1/facility/${facilityId}/charge_item_definition/`,
      {
        headers,
        data: {
          title: definitionTitle,
          slug_value: `${label.toLowerCase()}-${stamp.toLowerCase()}`,
          status: "active",
          category: null,
          can_edit_charge_item: true,
          discount_configuration: null,
          price_components: [
            { monetary_component_type: "base", amount: input.amount ?? "12" },
          ],
        },
      },
    ),
  );
  await read(
    await request.post(
      `${api}/api/v1/facility/${facilityId}/charge_item_definition/${definition.slug}/set_tags/`,
      { headers, data: { tags: [{ tag: pack.id }] } },
    ),
  );
  return {
    groupId: group.id,
    packageId: pack.id,
    packageName,
    definitionTitle,
    definitionSlug: definition.slug,
  };
}

/** Archives a Quick Add package and its group so they leave the picker. */
export async function archiveQuickAddPackageViaApi(input: {
  request: APIRequestContext;
  quickAddPackage: Pick<QuickAddPackage, "packageId" | "groupId">;
}): Promise<void> {
  const { request, quickAddPackage } = input;
  for (const id of [quickAddPackage.packageId, quickAddPackage.groupId]) {
    if (!id) continue;
    const tag = await read<Record<string, unknown>>(
      await request.get(`${getApiUrl()}/api/v1/tag_config/${id}/`, {
        headers: getApiHeaders(),
      }),
    );
    await read(
      await request.put(`${getApiUrl()}/api/v1/tag_config/${id}/`, {
        headers: getApiHeaders(),
        data: { ...tag, status: "archived" },
      }),
    );
  }
}

/** The account page that offers Quick Add: its charge items tab or the create invoice page. */
export type QuickAddEntry = "charge_items" | "invoices/create";

/**
 * Opens the Quick Add sheet on an account page and picks a package; returns
 * the sheet with the package's quantity input showing 1.
 */
export async function openQuickAddSheet(
  page: Page,
  input: {
    facilityId: string;
    accountId: string;
    packageName: string;
    entry?: QuickAddEntry;
  },
): Promise<Locator> {
  const entry = input.entry ?? "charge_items";
  await page.goto(
    `/facility/${input.facilityId}/billing/account/${input.accountId}/${entry}`,
  );
  if (entry === "invoices/create") {
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Quick Add", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Quick Add", exact: true });
  const pack = sheet.getByRole("button", {
    name: new RegExp(input.packageName),
  });
  await expect(pack).toBeEnabled();
  await pack.focus();
  await pack.press("Enter");
  await expect(sheet.getByRole("spinbutton")).toHaveValue("1");
  return sheet;
}

/**
 * Adds a Quick Add package's charge items to an account (see
 * `createQuickAddPackageViaApi` for the package) and waits until they are saved.
 */
export async function addChargeItemViaQuickAdd(
  page: Page,
  input: {
    facilityId: string;
    accountId: string;
    packageName: string;
    /** Quantity of each item; the sheet starts at 1. */
    quantity?: string;
    entry?: QuickAddEntry;
  },
): Promise<void> {
  await test.step(
    "billing.chargeitem.quick-add",
    async () => {
      const sheet = await openQuickAddSheet(page, input);
      if (input.quantity) {
        await sheet.getByRole("spinbutton").fill(input.quantity);
      }
      const applied = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().endsWith("/charge_item/apply_charge_item_defs/"),
      );
      await sheet.getByRole("button", { name: /^Add Items/ }).click();
      const response = await applied;
      expect(response.ok(), await response.text()).toBe(true);
      await expect(sheet).toHaveCount(0);
    },
    { box: true },
  );
}

/**
 * Creates an account for a patient from the patient's Accounts page; reads
 * the new account's id from the create response.
 */
export async function createAccountViaUi(
  page: Page,
  input: { facilityId: string; patientId: string; name?: string },
): Promise<{ accountId: string; name: string }> {
  const name =
    input.name ?? `E2E Account ${faker.string.alphanumeric(10).toUpperCase()}`;
  return test.step(
    "billing.account.create",
    async () => {
      await page.goto(
        `/facility/${input.facilityId}/patient/${input.patientId}/accounts`,
      );
      await page.getByRole("button", { name: "Create Account" }).click();

      const sheet = page.getByRole("dialog", { name: "Create Account" });
      await sheet.getByRole("textbox", { name: "Name *" }).fill(name);

      const created = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname.endsWith(
            `/facility/${input.facilityId}/account/`,
          ),
      );
      await sheet.getByRole("button", { name: "Create", exact: true }).click();
      const response = await created;
      expect(response.ok(), await response.text()).toBe(true);
      const account = (await response.json()) as { id: string };
      await expect(sheet).toBeHidden();
      return { accountId: account.id, name };
    },
    { box: true },
  );
}

/**
 * Creates an invoice on the account's Create Invoice page. Every billable
 * charge item is selected by default, so the invoice bills all of them; pass
 * `chargeItemTitles` to wait for those rows before submitting. Reads the
 * invoice id from the create response and waits for the invoice page.
 */
export async function createInvoiceViaUi(
  page: Page,
  input: { facilityId: string; accountId: string; chargeItemTitles?: string[] },
): Promise<{ invoiceId: string }> {
  return test.step(
    "billing.invoice.create",
    async () => {
      await page.goto(
        `/facility/${input.facilityId}/billing/account/${input.accountId}/invoices/create`,
      );
      for (const title of input.chargeItemTitles ?? []) {
        await expect(
          page.getByRole("row").filter({ hasText: title }),
        ).toBeVisible();
      }

      const created = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          new URL(response.url()).pathname.endsWith(
            `/facility/${input.facilityId}/invoice/`,
          ),
      );
      await page.getByRole("button", { name: /^Create Invoice/ }).click();
      const response = await created;
      expect(response.ok(), await response.text()).toBe(true);
      const invoice = (await response.json()) as { id: string };
      await expect(page).toHaveURL(
        new RegExp(`/billing/invoices/${invoice.id}`),
      );
      return { invoiceId: invoice.id };
    },
    { box: true },
  );
}

export interface RecordPaymentInput {
  facilityId: string;
  accountId: string;
  /** Amount Paid. */
  amount: string;
  /** Payment method label, e.g. "Cash" (default), "Credit Card", "Check". */
  method?: string;
  /** Location to pick; omit to keep the location the sheet remembers. */
  location?: string;
  /** Payment type label, e.g. /^Payment$/ or /^Advance$/; omit for the default. */
  paymentType?: RegExp;
  /** Amount Received, for cash payments only. Defaults to `amount`. */
  tenderedAmount?: string;
  /** Payment Date, as the datetime-local value "YYYY-MM-DDTHH:mm". */
  paymentDate?: string;
  /** Reference Number (not offered for cash). */
  referenceNumber?: string;
  notes?: string;
  /**
   * Set false to record on the account page already open, e.g. a second
   * payment without reloading. Defaults to opening the account page.
   */
  navigate?: boolean;
}

/**
 * Records a payment on an account from the account page's Advance/Receipt
 * sheet, and waits for the sheet's success message.
 */
export async function recordPaymentViaUi(
  page: Page,
  input: RecordPaymentInput,
): Promise<void> {
  await test.step(
    "billing.payment.record",
    async () => {
      if (input.navigate !== false) {
        await page.goto(
          `/facility/${input.facilityId}/billing/account/${input.accountId}`,
        );
      }
      await page.getByRole("button", { name: /advance/i }).click();

      const method = input.method ?? "Cash";
      await page.locator("label").filter({ hasText: method }).click();

      if (input.location) {
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Location" })
          .click();
        await page
          .locator('[data-slot="command-item"]')
          .filter({ hasText: input.location })
          .click();
      }

      if (input.paymentType) {
        await page
          .locator("label")
          .filter({ hasText: input.paymentType })
          .click();
      }

      await page
        .getByRole("textbox", { name: "Amount Paid" })
        .fill(input.amount);

      if (method === "Cash") {
        await page
          .getByRole("textbox", { name: "Amount Received" })
          .fill(input.tenderedAmount ?? input.amount);
      }

      if (input.paymentDate) {
        await page
          .getByRole("textbox", { name: "Payment Date" })
          .fill(input.paymentDate);
      }
      if (input.referenceNumber) {
        await page
          .getByRole("textbox", { name: "Reference Number" })
          .fill(input.referenceNumber);
      }
      if (input.notes) {
        await page.getByRole("textbox", { name: "Notes" }).fill(input.notes);
      }

      await page.getByRole("button", { name: /record payment/i }).click();
      await expect(
        page.getByText(/payment.*recorded.*successfully/i),
      ).toBeVisible();
    },
    { box: true },
  );
}
