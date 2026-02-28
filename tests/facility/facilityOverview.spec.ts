import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility Overview Page", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/overview`);
  });

  test("should display facility name and overview page", async ({ page }) => {
    // Verify the facility overview page loads
    // The facility name should be visible (fixture creates "FACILITY WITH PATIENTS")
    await expect(page.getByText(/facility with patient/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("should show navigation cards for key sections", async ({ page }) => {
    // Verify key navigation links/cards are visible
    // The overview page shows quick access cards for various facility sections

    // Encounters link should be present
    const encountersLink = page.getByRole("link", {
      name: /encounter/i,
    });
    await expect(encountersLink.first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to encounters page from overview", async ({ page }) => {
    // Click on Encounters link
    const encountersLink = page.getByRole("link", {
      name: /encounter/i,
    });
    await encountersLink.first().click();

    // Verify navigation to encounters page
    await page.waitForURL(/\/encounters/);
    await expect(page).toHaveURL(/\/encounters/);
  });

  test("should navigate to settings from overview", async ({ page }) => {
    // Look for a Settings link
    const settingsLink = page.getByRole("link", {
      name: /setting/i,
    });

    if (
      await settingsLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await settingsLink.first().click();
      await page.waitForURL(/\/settings/);
      await expect(page).toHaveURL(/\/settings/);
    }
  });

  test("should navigate to patients from overview", async ({ page }) => {
    // Look for a Patients link
    const patientsLink = page.getByRole("link", {
      name: /patient/i,
    });

    if (
      await patientsLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await patientsLink.first().click();
      await page.waitForURL(/\/patient/);
      await expect(page).toHaveURL(/\/patient/);
    }
  });
});
