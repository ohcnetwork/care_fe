import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  createAccount,
  createChargeItem,
  createInvoice,
  withoutFacilityPermissions,
  type SeededAccount,
} from "tests/helper/billing";
import { createTestPatient } from "tests/helper/patient";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const NOT_BILLABLE_REASON =
  "Only billable charge items can be moved to another account";

interface Seed {
  patientId: string;
  source: SeededAccount;
  target: SeededAccount;
  inactive: SeededAccount;
  closed: SeededAccount;
  billable: string[];
  notBillable: string;
  billed: string;
}

/**
 * A patient with a source account holding two billable items, one
 * not-billable item and one billed item (on a draft invoice), plus a valid
 * target account and two accounts that must never be offered as targets.
 */
async function seedAccounts(facilityId: string): Promise<Seed> {
  const suffix = faker.string.alphanumeric(6);
  const patientId = await createTestPatient("Charge Move");
  const account = (name: string, status?: string, billing_status?: string) =>
    createAccount(facilityId, patientId, {
      name: `${name} ${suffix}`,
      status,
      billing_status,
    });

  // A patient may have only one active + open account, so the target uses
  // another billing status that still accepts charge items.
  const source = await account("Source");
  const target = await account("Target", "active", "carecomplete_notbilled");
  const inactive = await account("Inactive", "inactive");
  const closed = await account("Closed", "active", "closed_completed");

  const item = (title: string, status?: string) =>
    createChargeItem(facilityId, {
      patientId,
      accountId: source.id,
      title: `${title} ${suffix}`,
      status,
    });

  const billable = [`Billable A ${suffix}`, `Billable B ${suffix}`];
  await item("Billable A");
  await item("Billable B");
  await item("Not billable", "not_billable");
  const billedItem = await item("Billed");
  await createInvoice(facilityId, {
    accountId: source.id,
    chargeItemIds: [billedItem.id],
  });

  return {
    patientId,
    source,
    target,
    inactive,
    closed,
    billable,
    notBillable: `Not billable ${suffix}`,
    billed: `Billed ${suffix}`,
  };
}

function chargeItemRow(page: Page, title: string) {
  return page.getByRole("row").filter({ hasText: title });
}

async function openChargeItems(page: Page, facilityId: string, seed: Seed) {
  await page.goto(
    `/facility/${facilityId}/billing/account/${seed.source.id}/charge_items`,
  );
  await expect(chargeItemRow(page, seed.billable[0])).toBeVisible();
}

test.describe("Charge item change account", () => {
  const facilityId = getFacilityId();
  let seed: Seed;

  test.beforeEach(async ({ page }) => {
    seed = await seedAccounts(facilityId);
    await openChargeItems(page, facilityId, seed);
  });

  test("only billable charge items can be selected", async ({ page }) => {
    await test.step("Billable rows have an enabled checkbox", async () => {
      for (const title of seed.billable) {
        await expect(
          chargeItemRow(page, title).getByRole("checkbox", {
            name: "Select Item",
          }),
        ).toBeEnabled();
      }
    });

    await test.step("Not billable and billed rows are disabled", async () => {
      for (const title of [seed.notBillable, seed.billed]) {
        const checkbox = chargeItemRow(page, title).getByRole("checkbox", {
          name: NOT_BILLABLE_REASON,
        });
        await expect(checkbox).toBeDisabled();
        await expect(checkbox).not.toBeChecked();
      }
    });

    await test.step("Disabled checkbox explains why on hover", async () => {
      await chargeItemRow(page, seed.notBillable)
        .getByRole("checkbox", { name: NOT_BILLABLE_REASON })
        .hover();
      await expect(page.getByText(NOT_BILLABLE_REASON)).toBeVisible();
    });

    await test.step("Row menu offers change account only for billable items", async () => {
      await chargeItemRow(page, seed.billable[0])
        .getByRole("button", { name: "More Actions" })
        .click();
      await expect(
        page.getByRole("menuitem", { name: "Change Account" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);

      await chargeItemRow(page, seed.billed)
        .getByRole("button", { name: "More Actions" })
        .click();
      await expect(
        page.getByRole("menuitem", { name: "Edit", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Change Account" }),
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
    });
  });

  test("select all selects only billable charge items", async ({ page }) => {
    const selectAll = page.getByRole("checkbox", { name: "Select All" });

    await selectAll.click();
    await expect(page.getByText("2 items selected")).toBeVisible();
    await expect(selectAll).toBeChecked();
    for (const title of seed.billable) {
      await expect(
        chargeItemRow(page, title).getByRole("checkbox", {
          name: "Select Item",
        }),
      ).toBeChecked();
    }

    await test.step("Unselecting one item makes select all partial", async () => {
      await chargeItemRow(page, seed.billable[0])
        .getByRole("checkbox", { name: "Select Item" })
        .click();
      await expect(page.getByText("1 items selected")).toBeVisible();
      await expect(selectAll).toHaveAttribute("aria-checked", "mixed");
    });

    await test.step("Clear selection hides the bulk bar", async () => {
      await page.getByRole("button", { name: "Clear Selection" }).click();
      await expect(page.getByText(/items selected/)).not.toBeVisible();
      await expect(selectAll).not.toBeChecked();
    });
  });

  test("moves selected billable items to another active account", async ({
    page,
  }) => {
    await chargeItemRow(page, seed.billable[0])
      .getByRole("checkbox", { name: "Select Item" })
      .click();
    await page
      .getByRole("button", { name: "Change Account", exact: true })
      .click();

    const sheet = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: "Change Account" }),
    });
    await expect(
      sheet.getByText("Move 1 charge item to a different account"),
    ).toBeVisible();
    await expect(sheet.getByText(seed.billable[0])).toBeVisible();

    await test.step("Only other active, open accounts are offered", async () => {
      await expect(sheet.getByText("Select target account")).toBeVisible();
      await expect(sheet.getByRole("radio")).toHaveCount(1);
      await expect(sheet.getByText(seed.target.name)).toBeVisible();
      for (const excluded of [seed.source, seed.inactive, seed.closed]) {
        await expect(sheet.getByText(excluded.name)).toHaveCount(0);
      }
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
        response.url().includes("/charge_item/change_account/") &&
        response.request().method() === "POST",
    );
    await submit.click();
    expect((await changeAccount).status()).toBe(201);
    await expectToast(page, "Charge items moved to new account successfully");
    await expect(sheet).not.toBeVisible();

    await test.step("Item leaves the source account", async () => {
      await expect(chargeItemRow(page, seed.billable[0])).toHaveCount(0);
      await expect(chargeItemRow(page, seed.billable[1])).toBeVisible();
    });

    await test.step("Item appears on the target account", async () => {
      await page.goto(
        `/facility/${facilityId}/billing/account/${seed.target.id}/charge_items`,
      );
      await expect(chargeItemRow(page, seed.billable[0])).toBeVisible();
    });
  });
});

test.describe("Charge item change account without permission", () => {
  test.use({ storageState: "tests/.auth/facilityAdmin.json" });

  const facilityId = getFacilityId();

  test("hides selection and change account without can_create_charge_item", async ({
    page,
  }) => {
    const seed = await seedAccounts(facilityId);
    await withoutFacilityPermissions(page, facilityId, [
      "can_create_charge_item",
    ]);
    await openChargeItems(page, facilityId, seed);

    await expect(
      page.getByRole("checkbox", { name: "Select All" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("checkbox", { name: "Select Item" }),
    ).toHaveCount(0);

    await chargeItemRow(page, seed.billable[0])
      .getByRole("button", { name: "More Actions" })
      .click();
    await expect(
      page.getByRole("menuitem", { name: "Edit", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Change Account" }),
    ).toHaveCount(0);
  });
});
