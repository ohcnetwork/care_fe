import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  createAccount,
  createChargeItem,
  createInvoice,
  createPayment,
  withoutFacilityPermissions,
  type SeededAccount,
} from "tests/helper/billing";
import { createTestPatient } from "tests/helper/patient";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const INVOICE_REASON =
  "Payments recorded against an invoice can't be moved to another account";
const STATUS_REASON =
  "Only active or draft payments can be moved to another account";

/** Distinct amounts identify each seeded payment's row. */
const AMOUNTS = {
  active: "111",
  draft: "222",
  cancelled: "333",
  againstInvoice: "444",
} as const;

interface Seed {
  source: SeededAccount;
  target: SeededAccount;
  closed: SeededAccount;
}

/**
 * A patient whose source account holds an active and a draft advance
 * (movable), a cancelled advance and a payment against an invoice (not
 * movable), plus a valid target and a billing-closed account.
 */
async function seedPayments(facilityId: string): Promise<Seed> {
  const suffix = faker.string.alphanumeric(6);
  const patientId = await createTestPatient("Payment Account");
  const account = (name: string, billing_status?: string) =>
    createAccount(facilityId, patientId, {
      name: `${name} ${suffix}`,
      billing_status,
    });

  // A patient may have only one active + open account, so the target uses
  // another billing status that still accepts payments.
  const source = await account("Source");
  const target = await account("Target", "carecomplete_notbilled");
  const closed = await account("Closed", "closed_completed");

  const chargeItem = await createChargeItem(facilityId, {
    patientId,
    accountId: source.id,
    title: `Invoiced ${suffix}`,
    amount: AMOUNTS.againstInvoice,
  });
  const invoice = await createInvoice(facilityId, {
    accountId: source.id,
    chargeItemIds: [chargeItem.id],
  });

  const accountId = source.id;
  await createPayment(facilityId, { accountId, amount: AMOUNTS.active });
  await createPayment(facilityId, {
    accountId,
    amount: AMOUNTS.draft,
    status: "draft",
  });
  await createPayment(facilityId, {
    accountId,
    amount: AMOUNTS.cancelled,
    status: "cancelled",
  });
  await createPayment(facilityId, {
    accountId,
    amount: AMOUNTS.againstInvoice,
    reconciliationType: "payment",
    targetInvoiceId: invoice.id,
  });

  return { source, target, closed };
}

function paymentRow(page: Page, amount: string) {
  return page.getByRole("row").filter({ hasText: `${amount}.00` });
}

async function openPayments(page: Page, facilityId: string, accountId: string) {
  await page.goto(
    `/facility/${facilityId}/billing/account/${accountId}/payments`,
  );
}

test.describe("Payment change account", () => {
  const facilityId = getFacilityId();
  let seed: Seed;

  test.beforeEach(async ({ page }) => {
    seed = await seedPayments(facilityId);
    await openPayments(page, facilityId, seed.source.id);
    await expect(paymentRow(page, AMOUNTS.active)).toBeVisible();
  });

  test("only active or draft payments without an invoice can be selected", async ({
    page,
  }) => {
    await test.step("Active and draft payments are selectable", async () => {
      for (const amount of [AMOUNTS.active, AMOUNTS.draft]) {
        await expect(
          paymentRow(page, amount).getByRole("checkbox", {
            name: "Select Item",
          }),
        ).toBeEnabled();
      }
    });

    await test.step("Cancelled payment is disabled", async () => {
      const checkbox = paymentRow(page, AMOUNTS.cancelled).getByRole(
        "checkbox",
        { name: STATUS_REASON },
      );
      await expect(checkbox).toBeDisabled();
      await checkbox.hover();
      await expect(page.getByText(STATUS_REASON)).toBeVisible();
    });

    await test.step("Payment against an invoice is disabled", async () => {
      const checkbox = paymentRow(page, AMOUNTS.againstInvoice).getByRole(
        "checkbox",
        { name: INVOICE_REASON },
      );
      await expect(checkbox).toBeDisabled();
      await checkbox.hover();
      await expect(page.getByText(INVOICE_REASON)).toBeVisible();
    });
  });

  test("select all selects only movable payments", async ({ page }) => {
    const selectAll = page.getByRole("checkbox", { name: "Select All" });

    await selectAll.click();
    await expect(page.getByText("2 items selected")).toBeVisible();
    await expect(selectAll).toBeChecked();

    await paymentRow(page, AMOUNTS.draft)
      .getByRole("checkbox", { name: "Select Item" })
      .click();
    await expect(page.getByText("1 items selected")).toBeVisible();
    await expect(selectAll).toHaveAttribute("aria-checked", "mixed");

    await page.getByRole("button", { name: "Clear Selection" }).click();
    await expect(page.getByText(/items selected/)).not.toBeVisible();
  });

  test("moves a selected payment to another active account", async ({
    page,
  }) => {
    await paymentRow(page, AMOUNTS.active)
      .getByRole("checkbox", { name: "Select Item" })
      .click();
    await page
      .getByRole("button", { name: "Change Account", exact: true })
      .click();

    const sheet = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: "Change Account" }),
    });
    await expect(
      sheet.getByText("Move 1 payment to a different account"),
    ).toBeVisible();
    await expect(sheet.getByText("Selected payments (1)")).toBeVisible();

    await test.step("Only other active, open accounts are offered", async () => {
      await expect(sheet.getByRole("radio")).toHaveCount(1);
      await expect(sheet.getByText(seed.target.name)).toBeVisible();
      await expect(sheet.getByText(seed.source.name)).toHaveCount(0);
      await expect(sheet.getByText(seed.closed.name)).toHaveCount(0);
    });

    const submit = sheet.getByRole("button", {
      name: "Change Account",
      exact: true,
    });
    await expect(submit).toBeDisabled();
    await sheet.getByText(seed.target.name).click();
    await expect(sheet.getByRole("radio")).toBeChecked();

    const changeAccount = page.waitForResponse(
      (response) =>
        response.url().includes("/payment_reconciliation/change_account/") &&
        response.request().method() === "POST",
    );
    await submit.click();
    expect((await changeAccount).status()).toBe(201);
    await expectToast(page, "Payments moved to new account successfully");
    await expect(sheet).not.toBeVisible();

    await test.step("Payment leaves the source account", async () => {
      await expect(paymentRow(page, AMOUNTS.active)).toHaveCount(0);
      await expect(paymentRow(page, AMOUNTS.draft)).toBeVisible();
    });

    await test.step("Payment appears on the target account", async () => {
      await openPayments(page, facilityId, seed.target.id);
      await expect(paymentRow(page, AMOUNTS.active)).toBeVisible();
    });
  });
});

test.describe("Payment change account without permission", () => {
  test.use({ storageState: "tests/.auth/facilityAdmin.json" });

  const facilityId = getFacilityId();

  test("hides selection without can_write_payment_reconciliation", async ({
    page,
  }) => {
    const seed = await seedPayments(facilityId);
    await withoutFacilityPermissions(page, facilityId, [
      "can_write_payment_reconciliation",
    ]);
    await openPayments(page, facilityId, seed.source.id);
    await expect(paymentRow(page, AMOUNTS.active)).toBeVisible();

    await expect(page.getByRole("checkbox")).toHaveCount(0);
  });
});
