import { expect, type Page, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getAccountId } from "tests/support/accountId";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let accountId: string;

/**
 * Creates a new draft invoice from the billing account page.
 * Navigates to the account, clicks "Create Invoice", adds a Paracetamol
 * charge item via the inline picker (so the submit button is enabled),
 * submits the form, and returns the invoiceId parsed from the resulting
 * URL.
 *
 * @param page - Playwright Page instance
 * @param fId - The facility UUID
 * @param aId - The billing account UUID
 * @returns The newly created invoice UUID
 */
async function createInvoice(
  page: Page,
  fId: string,
  aId: string,
): Promise<string> {
  await page.goto(`/facility/${fId}/billing/account/${aId}/invoices/create`);
  await expect(page).toHaveURL(/\/invoices\/create/, { timeout: 10000 });

  const submitBtn = page.locator('button[type="submit"]');
  await submitBtn.waitFor({ state: "attached", timeout: 10000 });

  // Wait for the charge-items API to resolve before deciding whether we need
  // the picker.  isEnabled() checked immediately after "attached" races the
  // network request and returns false even when pre-existing items exist.
  let alreadyEnabled = false;
  try {
    await expect(submitBtn).toBeEnabled({ timeout: 8000 });
    alreadyEnabled = true;
  } catch (err) {
    console.warn(
      `Submit button not enabled within 8s — falling back to picker flow. Reason: ${err instanceof Error ? err.message : err}`,
    );
    alreadyEnabled = false;
  }
  if (!alreadyEnabled) {
    // Picker auto-opens when there are no charge items (defaultOpen=true).
    // Do NOT click the trigger — clicking a trigger on an already-open Popover closes it.
    await expect(page.getByText("Medications")).toBeVisible({ timeout: 15000 });
    await page.getByText("Medications").click();
    await expect(page.getByText("Paracetamol").first()).toBeVisible({
      timeout: 10000,
    });
    await page.getByText("Paracetamol").first().click({ force: true });
    // Quantity input is auto-focused; press Enter to confirm with default qty 1.
    await page.keyboard.press("Enter");
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
  }

  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(
    /\/invoices\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    { timeout: 15000 },
  );
  const match = page
    .url()
    .match(
      /\/invoices\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/,
    );
  if (!match?.[1]) {
    throw new Error(
      `Failed to parse invoiceId from URL after invoice creation: ${page.url()}`,
    );
  }
  return match[1];
}

/**
 * Issues an existing draft invoice by navigating to its show page and
 * clicking "Issue Invoice". Waits for the success toast and the Issued
 * badge before returning so callers can rely on the invoice being in the
 * Issued state.
 *
 * @param page - Playwright Page instance
 * @param fId - The facility UUID
 * @param invoiceId - The invoice UUID to issue
 */
async function issueInvoice(
  page: Page,
  fId: string,
  invoiceId: string,
): Promise<void> {
  await page.goto(`/facility/${fId}/billing/invoices/${invoiceId}`);
  await page.getByRole("button", { name: /issue invoice/i }).click();
  // The issue action goes through updateInvoice which shows "Invoice updated successfully".
  await expectToast(page, /invoice updated successfully/i);
  await expect(page.getByText(/issued/i).first()).toBeVisible({
    timeout: 10000,
  });
  // Issuing auto-opens the Record Payment sheet — close it so callers
  // can interact with the page without the sheet overlay blocking them.
  const cancelBtn = page.getByRole("button", { name: /^cancel$/i });
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
  }
}

test.beforeAll(() => {
  facilityId = getFacilityId();
  accountId = getAccountId();
});

test.describe("Invoice Show Page", () => {
  test("shows invoice summary section and patient details", async ({
    page,
  }) => {
    const invoiceId = await createInvoice(page, facilityId, accountId);
    await page.goto(`/facility/${facilityId}/billing/invoices/${invoiceId}`);

    await expect(page.getByText(/invoice summary/i).first()).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/tax invoice/i).first()).toBeVisible();

    await expect(
      page
        .locator("label", { hasText: /patient name/i })
        .locator("xpath=following-sibling::a"),
    ).toBeVisible();

    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });

  test("shows charge items table with expected column headers", async ({
    page,
  }) => {
    const invoiceId = await createInvoice(page, facilityId, accountId);
    await page.goto(`/facility/${facilityId}/billing/invoices/${invoiceId}`);

    await expect(page.getByRole("columnheader", { name: /item/i })).toBeVisible(
      { timeout: 10000 },
    );

    await expect(
      page.getByRole("columnheader", { name: /unit price/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: /qty/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", { name: /total/i }),
    ).toBeVisible();

    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("issues a draft invoice and shows Issued status", async ({ page }) => {
    const invoiceId = await createInvoice(page, facilityId, accountId);
    await page.goto(`/facility/${facilityId}/billing/invoices/${invoiceId}`);

    await expect(
      page.getByRole("button", { name: /issue invoice/i }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /issue invoice/i }).click();

    // The issue action goes through updateInvoice which shows "Invoice updated successfully".
    await expectToast(page, /invoice updated successfully/i);

    await expect(page.getByText(/issued/i).first()).toBeVisible({
      timeout: 10000,
    });

    await expect(
      page.getByRole("button", { name: /issue invoice/i }),
    ).not.toBeVisible();
  });

  test("locks an issued invoice and shows Locked badge", async ({ page }) => {
    const invoiceId = await createInvoice(page, facilityId, accountId);
    await issueInvoice(page, facilityId, invoiceId);

    await page.locator("[data-slot='dropdown-menu-trigger']").last().click();

    await page.getByRole("menuitem", { name: /lock invoice/i }).click();

    await expectToast(page, /invoice locked successfully/i);

    await expect(page.getByText(/locked/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("unlocks a locked invoice and removes the Locked badge", async ({
    page,
  }) => {
    const invoiceId = await createInvoice(page, facilityId, accountId);
    await issueInvoice(page, facilityId, invoiceId);

    const menuButton = page
      .locator("[data-slot='dropdown-menu-trigger']")
      .last();

    await menuButton.click();
    await page.getByRole("menuitem", { name: /lock invoice/i }).click();
    await expectToast(page, /invoice locked successfully/i);
    await expect(page.getByText(/locked/i).first()).toBeVisible({
      timeout: 10000,
    });

    await menuButton.click();
    await page.getByRole("menuitem", { name: /unlock invoice/i }).click();

    await expectToast(page, /invoice unlocked successfully/i);

    await expect(
      page.locator("[data-slot='badge']").filter({ hasText: /^locked$/i }),
    ).not.toBeVisible();
  });

  test("cancels an invoice after confirming the dialog", async ({ page }) => {
    const invoiceId = await createInvoice(page, facilityId, accountId);
    await issueInvoice(page, facilityId, invoiceId);

    await page.locator("[data-slot='dropdown-menu-trigger']").last().click();

    await page.getByRole("menuitem", { name: /mark as cancelled/i }).click();

    await expect(page.getByRole("alertdialog")).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/are you sure.*cancel/i)).toBeVisible();

    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: /confirm/i })
      .click();

    await expectToast(page, /invoice cancelled successfully/i);

    await expect(page.getByText(/cancelled/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
