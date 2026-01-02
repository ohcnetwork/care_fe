import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Back button should not appear when page is opened in a new tab without history", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test("Back Button in Patient Registration", async ({ page, context }) => {
    // Navigate to patient registration page
    await page.goto(`/facility/${facilityId}/patients`);
    await page.getByRole("button", { name: /add new patient/i }).click();

    // Verify back button IS visible (has history)
    const backButtonOriginal = page.getByRole("link", { name: /back/i });
    await expect(backButtonOriginal).toBeVisible();

    // Get the current patient registration URL
    const patientRegUrl = page.url();

    // Open the same patient registration page directly in a new tab (no navigation history)
    const newPage = await context.newPage();
    await newPage.goto(patientRegUrl);

    // Verify back button is NOT visible (no history)
    const backButton = newPage.getByRole("link", { name: /back/i });
    await expect(backButton).not.toBeVisible();
  });

  test("Back button in Account Show", async ({ page, context }) => {
    // Navigate to account show page
    await page.goto(`/facility/${facilityId}/billing/account`);

    // Click on the first "Go to account" button
    await page.getByRole("button", { name: "Go to account" }).first().click();

    // Verify back button IS visible (has history)
    const backButtonOriginal = page.getByRole("link", { name: /back/i });
    await expect(backButtonOriginal).toBeVisible();

    // Get the current URL
    const accountUrl = page.url();

    // Open the same page directly in a new tab (no navigation history)
    const newPage = await context.newPage();
    await newPage.goto(accountUrl);

    // Verify back button is NOT visible (no history)
    const backButton = newPage.getByRole("link", { name: /back/i });
    await expect(backButton).not.toBeVisible();
  });
});
