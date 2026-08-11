import { expect, Locator, Page, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const MEDICINE_NAME = "Paracetamol";
const DISPENSE_LOCATION = "Pharmacy";
const INSUFFICIENT_STOCK_ERROR = "Inventory item does not have enough stock";
const GENERIC_ERROR = "Something went wrong";
const EMPTY_DISPENSE_HISTORY = "No dispense history found";
const MINIMUM_STOCK = 3;

/**
 * The dispense drawer sends one batch request with one sub-request for each
 * line item. The front-end checks the quantity of each line item against the
 * stock, but it does not add the quantities of the line items together. So two
 * line items of the same medicine pass the front-end check and the backend
 * rejects the second sub-request.
 *
 * This test makes sure that the batch error handler shows the error of the
 * failed sub-request, and that it shows no generic error for the sub-request
 * that passed.
 */
test.describe("Dispense with a total quantity that is more than the stock", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;

  function getDispenseSheet(page: Page) {
    return page.locator('[data-slot="sheet-content"]');
  }

  function getLineItems(sheet: Locator) {
    return sheet.locator('[data-slot="table-body"] tr');
  }

  async function openDispenseSheet(page: Page) {
    await page.getByRole("tab", { name: "Dispense History" }).click();
    await page
      .getByRole("button", { name: "Dispense", exact: true })
      .first()
      .click();

    const locationDialog = page.getByRole("dialog");
    await locationDialog.getByPlaceholder("Search").fill(DISPENSE_LOCATION);
    await locationDialog
      .getByRole("option", { name: DISPENSE_LOCATION })
      .first()
      .click();

    const sheet = getDispenseSheet(page);
    await expect(sheet).toBeVisible();
    return sheet;
  }

  async function addLineItem(page: Page, sheet: Locator, name: string) {
    await sheet
      .getByRole("combobox")
      .filter({ hasText: "Add Item" })
      .first()
      .click();

    const picker = page.locator("[data-radix-popper-content-wrapper]").last();
    await picker.locator('[data-slot="command-input"]').fill(name);
    await picker.getByRole("option", { name }).first().click();
  }

  /**
   * Reads the stock of the lot that the drawer selects for a line item.
   *
   * The lot button holds 2 badges: the unit price and the stock. Only the
   * price badge holds a monetary value, so the filter keeps the stock badge.
   */
  async function readAvailableStock(page: Page, lineItem: Locator) {
    const stockBadge = lineItem
      .locator('[data-slot="badge"]')
      .filter({ hasNot: page.locator('[data-slot="monetary-value"]') })
      .first();
    await expect(stockBadge).toBeVisible();

    const badgeText = await stockBadge.innerText();
    const stock = Number.parseFloat(badgeText);
    if (Number.isNaN(stock)) {
      throw new Error(`Failed to read the stock from the badge: "${badgeText}"`);
    }
    return stock;
  }

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/medicines`,
    );
  });

  test("shows the error of the failed sub-request only", async ({ page }) => {
    const sheet = await openDispenseSheet(page);
    let stock = 0;

    await test.step("Add the first line item and read the stock", async () => {
      await addLineItem(page, sheet, MEDICINE_NAME);
      await expect(getLineItems(sheet)).toHaveCount(1);

      stock = await readAvailableStock(page, getLineItems(sheet).first());
      expect(stock).toBeGreaterThanOrEqual(MINIMUM_STOCK);
    });

    // Each quantity stays below the stock, but the 2 quantities together are
    // more than the stock.
    const quantity = String(Math.floor(stock / 2) + 1);

    await test.step("Add a second line item of the same medicine", async () => {
      await addLineItem(page, sheet, MEDICINE_NAME);
      await expect(getLineItems(sheet)).toHaveCount(2);
    });

    await test.step("Set the quantity of both line items", async () => {
      for (const lineItem of await getLineItems(sheet).all()) {
        await lineItem.getByRole("spinbutton").first().fill(quantity);
      }
    });

    await test.step("Confirm the dispense", async () => {
      await sheet.getByRole("button", { name: "Confirm Dispense" }).click();
    });

    await test.step("Verify the error messages", async () => {
      await expectToast(page, INSUFFICIENT_STOCK_ERROR);
      await expect(
        page.locator(".toaster.group").getByText(GENERIC_ERROR),
      ).toHaveCount(0);
      await expect(sheet).toBeVisible();
    });

    await test.step("Verify that the dispense created no record", async () => {
      await sheet.getByRole("button", { name: "Cancel" }).click();
      await expect(sheet).not.toBeVisible();
      await expect(page.getByText(EMPTY_DISPENSE_HISTORY)).toBeVisible();
    });
  });
});
