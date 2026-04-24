import { faker } from "@faker-js/faker";
import { Page, expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

interface AccountInfo {
  id: string;
  name: string;
  status: string;
  billing_status: string;
  total_paid?: string;
  patient?: string;
}

async function createAccount(
  facilityId: string,
  patientId: string,
  opts: { name: string; status: string; billing_status: string },
): Promise<AccountInfo> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/account/`,
    {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        name: opts.name,
        status: opts.status,
        billing_status: opts.billing_status,
        patient: patientId,
        service_period: { start: new Date().toISOString() },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create account: ${res.status} — ${text}`);
  }
  return (await res.json()) as AccountInfo;
}

async function updateAccount(
  facilityId: string,
  account: AccountInfo,
  updates: Partial<{ name: string; status: string; billing_status: string }>,
): Promise<AccountInfo> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/account/${account.id}/`,
    {
      method: "PUT",
      headers: getApiHeaders(),
      body: JSON.stringify({
        ...account,
        ...updates,
        patient: account.patient ?? undefined,
        service_period: { start: new Date().toISOString() },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update account: ${res.status} — ${text}`);
  }
  return (await res.json()) as AccountInfo;
}

async function getAccount(
  facilityId: string,
  accountId: string,
): Promise<AccountInfo> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/account/${accountId}/`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) throw new Error(`Failed to get account: ${res.status}`);
  return (await res.json()) as AccountInfo;
}

async function recordPayment(
  facilityId: string,
  accountId: string,
  amount: string,
): Promise<void> {
  const now = new Date().toISOString().slice(0, 16);
  const res = await fetch(
    `${getApiUrl()}/api/v1/facility/${facilityId}/payment_reconciliation/`,
    {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        account: accountId,
        reconciliation_type: "payment",
        status: "active",
        kind: "deposit",
        issuer_type: "patient",
        outcome: "complete",
        method: "cash",
        payment_datetime: now,
        amount,
        tendered_amount: amount,
        returned_amount: "0",
        is_credit_note: false,
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to record payment: ${res.status} — ${text}`);
  }
}

const moreOptionsSelector =
  "[data-slot='dropdown-menu-trigger']:has(svg.lucide-ellipsis-vertical)";

async function openTransferPaymentSheet(page: Page) {
  await page.locator(moreOptionsSelector).first().click();
  await page.getByRole("menuitem", { name: /Transfer Payment/i }).click();
  await expect(page.getByText("Select target account")).toBeVisible();
}

async function deactivateAccount(
  facilityId: string,
  account: AccountInfo,
): Promise<void> {
  try {
    await updateAccount(facilityId, account, { status: "inactive" });
  } catch {
    // ignore — account may already be inactive or deleted
  }
}

async function createPatient(): Promise<string> {
  const phone = `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`;
  // Fetch a govt organization for geo_organization (required field)
  const orgRes = await fetch(
    `${getApiUrl()}/api/v1/organization/?org_type=govt&limit=1`,
    { headers: getApiHeaders() },
  );
  if (!orgRes.ok)
    throw new Error(`Failed to fetch organizations: ${orgRes.status}`);
  const orgData = (await orgRes.json()) as { results: { id: string }[] };
  const geoOrg = orgData.results[0]?.id;
  if (!geoOrg)
    throw new Error("No govt organization found for geo_organization");

  const res = await fetch(`${getApiUrl()}/api/v1/patient/`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify({
      name: `Transfer Test ${faker.string.alphanumeric(6)}`,
      gender: "male",
      phone_number: phone,
      date_of_birth: "1990-01-15",
      geo_organization: geoOrg,
      identifiers: [],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create patient: ${res.status} — ${text}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

test.describe("Account Transfer Payment", () => {
  const facilityId = getFacilityId();
  let patientId: string;

  let sourceAccount: AccountInfo;
  let targetAccount: AccountInfo;
  let billingAccount: AccountInfo;
  let nonActiveAccounts: AccountInfo[];

  test.beforeAll(async () => {
    // Create a dedicated patient so we don't interfere with other tests
    patientId = await createPatient();

    const suffix = faker.string.alphanumeric(6);

    sourceAccount = await createAccount(facilityId, patientId, {
      name: `Source CareComplete ${suffix}`,
      status: "active",
      billing_status: "carecomplete_notbilled",
    });

    targetAccount = await createAccount(facilityId, patientId, {
      name: `Target Open ${suffix}`,
      status: "active",
      billing_status: "open",
    });

    billingAccount = await createAccount(facilityId, patientId, {
      name: `Billing Active ${suffix}`,
      status: "active",
      billing_status: "billing",
    });

    // Non-active accounts: every status × billing_status combination (9 total)
    const nonActiveConfigs = [
      // inactive × all billing statuses
      {
        name: `Inactive Open ${suffix}`,
        status: "inactive",
        billing_status: "open",
      },
      {
        name: `Inactive CareComplete ${suffix}`,
        status: "inactive",
        billing_status: "carecomplete_notbilled",
      },
      {
        name: `Inactive Billing ${suffix}`,
        status: "inactive",
        billing_status: "billing",
      },
      // entered_in_error × all billing statuses
      {
        name: `Error Open ${suffix}`,
        status: "entered_in_error",
        billing_status: "open",
      },
      {
        name: `Error CareComplete ${suffix}`,
        status: "entered_in_error",
        billing_status: "carecomplete_notbilled",
      },
      {
        name: `Error Billing ${suffix}`,
        status: "entered_in_error",
        billing_status: "billing",
      },
      // on_hold × all billing statuses
      {
        name: `OnHold Open ${suffix}`,
        status: "on_hold",
        billing_status: "open",
      },
      {
        name: `OnHold CareComplete ${suffix}`,
        status: "on_hold",
        billing_status: "carecomplete_notbilled",
      },
      {
        name: `OnHold Billing ${suffix}`,
        status: "on_hold",
        billing_status: "billing",
      },
    ];
    nonActiveAccounts = [];
    for (const config of nonActiveConfigs) {
      nonActiveAccounts.push(
        await createAccount(facilityId, patientId, config),
      );
    }

    // Record a payment on the source account so total_paid > 0
    await recordPayment(facilityId, sourceAccount.id, "500");
  });

  test.afterAll(async () => {
    // Deactivate accounts to avoid conflicts on re-runs
    if (sourceAccount) await deactivateAccount(facilityId, sourceAccount);
    if (targetAccount) await deactivateAccount(facilityId, targetAccount);
    if (billingAccount) await deactivateAccount(facilityId, billingAccount);
  });

  test("should show more options dropdown only for active accounts", async ({
    page,
  }) => {
    // Active accounts with different billing statuses — all show dropdown with menu items
    for (const account of [sourceAccount, targetAccount, billingAccount]) {
      await page.goto(`/facility/${facilityId}/billing/account/${account.id}`);
      await expect(page.getByText(account.name)).toBeVisible();
      await expect(page.locator(moreOptionsSelector).first()).toBeVisible();

      // Open dropdown and verify menu items are present
      await page.locator(moreOptionsSelector).first().click();
      await expect(
        page.getByRole("menuitem", { name: /Transfer Payment/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: /Record Credit Note/i }),
      ).toBeVisible();
      // Close dropdown before navigating
      await page.keyboard.press("Escape");
    }

    // Non-active statuses × all billing statuses — no dropdown
    for (const account of nonActiveAccounts) {
      await page.goto(`/facility/${facilityId}/billing/account/${account.id}`);
      await expect(page.getByText(account.name)).toBeVisible();
      await expect(page.locator(moreOptionsSelector)).not.toBeVisible();
    }
  });

  test("should transfer payment between two active accounts", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/billing/account/${sourceAccount.id}`,
    );
    await expect(page.getByText(sourceAccount.name)).toBeVisible();

    await openTransferPaymentSheet(page);

    const amount = faker.number.int({ min: 1, max: 10 }).toString();
    await page.getByPlaceholder("Enter amount").fill(amount);

    // Active target visible, non-active targets not visible
    await expect(page.getByText(targetAccount.name)).toBeVisible();
    await expect(page.getByText(nonActiveAccounts[0].name)).not.toBeVisible();

    await page.getByText(targetAccount.name).click();

    await page
      .locator("[data-slot='sheet-footer']")
      .getByRole("button", { name: /transfer payment/i })
      .click();

    await expect(
      page.getByText(/payment.*transferred.*successfully/i),
    ).toBeVisible();

    // Verify outgoing transfer on source account's Payments tab
    await page.goto(
      `/facility/${facilityId}/billing/account/${sourceAccount.id}/payments`,
    );
    await expect(page.getByText("Outgoing Transfer").first()).toBeVisible();

    // Click View on the outgoing transfer to see payment detail
    const outgoingRow = page
      .locator("tr", { hasText: "Outgoing Transfer" })
      .first();
    await outgoingRow.getByRole("link", { name: /view/i }).click();
    await page.waitForURL(/\/billing\/payments\//);

    // Verify payment detail page for outgoing transfer
    await expect(page.getByText("Outgoing Transfer").first()).toBeVisible();
    await expect(page.getByText("Cash").first()).toBeVisible();
    await expect(page.getByText("Active")).toBeVisible();
    await expect(page.getByText("Complete")).toBeVisible();
    await expect(
      page.getByText(`Transferred to account ${targetAccount.id}`),
    ).toBeVisible();

    // Verify incoming transfer on target account's Payments tab
    await page.goto(
      `/facility/${facilityId}/billing/account/${targetAccount.id}/payments`,
    );
    await expect(page.getByText("Incoming Transfer").first()).toBeVisible();

    // Click View on the incoming transfer to see payment detail
    const incomingRow = page
      .locator("tr", { hasText: "Incoming Transfer" })
      .first();
    await incomingRow.getByRole("link", { name: /view/i }).click();
    await page.waitForURL(/\/billing\/payments\//);

    // Verify payment detail page for incoming transfer
    await expect(page.getByText("Incoming Transfer").first()).toBeVisible();
    await expect(page.getByText("Cash").first()).toBeVisible();
    await expect(page.getByText("Active")).toBeVisible();
    await expect(page.getByText("Complete")).toBeVisible();
    await expect(
      page.getByText(`Transferred from account ${sourceAccount.id}`),
    ).toBeVisible();
  });

  test("should show error when transfer amount exceeds total paid", async ({
    page,
  }) => {
    // Fetch actual total_paid after the recorded payment
    const accountData = await getAccount(facilityId, sourceAccount.id);
    const totalPaid = parseFloat(accountData.total_paid || "0");
    expect(totalPaid).toBeGreaterThan(0);

    await page.goto(
      `/facility/${facilityId}/billing/account/${sourceAccount.id}`,
    );
    await expect(page.getByText(sourceAccount.name)).toBeVisible();

    await openTransferPaymentSheet(page);

    // Try transferring ₹1 more than total_paid — should show error
    const excessAmount = (totalPaid + 1).toString();
    await page.getByPlaceholder("Enter amount").fill(excessAmount);
    await page.getByText(targetAccount.name).click();

    await page
      .locator("[data-slot='sheet-footer']")
      .getByRole("button", { name: /transfer payment/i })
      .click();

    await expect(
      page.getByText(/transfer amount cannot exceed the total paid amount/i),
    ).toBeVisible();
  });

  test("should disable transfer button when amount is zero or negative", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/billing/account/${sourceAccount.id}`,
    );
    await expect(page.getByText(sourceAccount.name)).toBeVisible();

    await openTransferPaymentSheet(page);
    await page.getByText(targetAccount.name).click();

    const transferButton = page
      .locator("[data-slot='sheet-footer']")
      .getByRole("button", { name: /transfer payment/i });

    // Zero amount — disabled
    await page.getByPlaceholder("Enter amount").fill("0");
    await expect(transferButton).toBeDisabled();

    // Negative amount — disabled
    await page.getByPlaceholder("Enter amount").fill("-100");
    await expect(transferButton).toBeDisabled();
  });

  test("should disable transfer button without selecting target account", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/billing/account/${sourceAccount.id}`,
    );
    await expect(page.getByText(sourceAccount.name)).toBeVisible();

    await openTransferPaymentSheet(page);

    const amount = faker.number.int({ min: 100, max: 1000 }).toString();
    await page.getByPlaceholder("Enter amount").fill(amount);

    await expect(
      page
        .locator("[data-slot='sheet-footer']")
        .getByRole("button", { name: /transfer payment/i }),
    ).toBeDisabled();
  });
});
