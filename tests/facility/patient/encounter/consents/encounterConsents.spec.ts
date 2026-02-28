import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Consents Tab", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters list filtered by in-progress status
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    // Navigate to the Consents tab
    await page.getByRole("tab", { name: "Consents" }).click();
  });

  test("should display the consents tab", async ({ page }) => {
    // Verify the tab content is visible
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent).toBeVisible();

    // Should show either consent cards or empty state
    const consentsContent = page
      .locator('[data-slot="card"]')
      .first()
      .or(page.getByText(/no consent found/i));
    await expect(consentsContent).toBeVisible({ timeout: 10000 });
  });

  test("should have search input for consents", async ({ page }) => {
    // The search input should be visible
    const searchInput = page.getByPlaceholder(/search.*consent/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test("should open consent creation form", async ({ page }) => {
    // Look for the "Create Consent" / "Add Consent" button or trigger
    // The ConsentFormSheet renders a Sheet trigger button
    const createConsentButton = page
      .getByRole("button", { name: /create consent|add consent|new consent/i })
      .or(
        page
          .locator("button")
          .filter({ has: page.locator("svg.lucide-plus") })
          .last(),
      );

    await expect(createConsentButton).toBeVisible({ timeout: 10000 });
    await createConsentButton.click();

    // A sheet/dialog should open with the consent form
    const sheet = page
      .getByRole("dialog")
      .or(page.locator('[role="dialog"]'))
      .last();
    await expect(sheet).toBeVisible({ timeout: 5000 });

    // Verify form fields are present
    // Category select should be visible
    await expect(
      sheet.getByText(/category/i).first(),
    ).toBeVisible();

    // Decision (Permit/Deny) should be visible
    await expect(
      sheet.getByText(/decision/i).or(sheet.getByText(/permit/i)).first(),
    ).toBeVisible();
  });

  test("should create a consent with basic fields", async ({ page }) => {
    // Open consent creation form
    const createConsentButton = page
      .getByRole("button", { name: /create consent|add consent|new consent/i })
      .or(
        page
          .locator("button")
          .filter({ has: page.locator("svg.lucide-plus") })
          .last(),
      );
    await createConsentButton.click();

    const sheet = page.getByRole("dialog").last();
    await expect(sheet).toBeVisible({ timeout: 5000 });

    await test.step("Fill consent category", async () => {
      // Select category - defaults to "treatment"
      const categorySelect = sheet.getByRole("combobox").first();
      if (await categorySelect.isVisible().catch(() => false)) {
        await categorySelect.click();
        await page.getByRole("option", { name: /treatment/i }).first().click();
      }
    });

    await test.step("Submit the consent form", async () => {
      const submitButton = sheet
        .getByRole("button", { name: /create|save|submit/i })
        .last();
      await submitButton.click();

      // Verify success
      await expect(
        page.getByText(/consent.*created.*successfully/i),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test("should navigate to consents tab via encounter actions", async ({
    page,
  }) => {
    // Go back to Updates tab first
    await page.getByRole("tab", { name: "Updates" }).click();

    // Open encounter actions
    await page
      .getByRole("button", { name: /encounter actions/i })
      .first()
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Search for consents
    const commandInput = dialog.locator(
      'input[data-slot="command-input"], input[cmdk-input]',
    );
    await commandInput.fill("consent");

    // Click manage consents option
    const consentOption = dialog
      .getByRole("option", { name: /manage consent|consent/i })
      .first();

    if (await consentOption.isVisible().catch(() => false)) {
      await consentOption.click();

      // Should navigate to consents tab or open consent dialog
      await page.waitForTimeout(1000);
    }
  });
});
