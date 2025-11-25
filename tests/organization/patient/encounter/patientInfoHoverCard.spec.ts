import { expect, test } from "@playwright/test";
test.use({ storageState: "tests/.auth/user.json" });

test.describe("PatientInfoHoverCard Conditional Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Governance" }).click();
    await page
      .getByRole("link", { name: /Government$/ })
      .first()
      .click();
    await page.getByRole("menuitem", { name: "patients" }).click();
  });

  test("should NOT show Patient Home button in encounter accessed via organization route", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");
    await page.locator("[data-slot='card-content']").first().click();

    await page.getByRole("tab", { name: "Encounters" }).click();

    await page.getByRole("link", { name: "View Encounter" }).click();

    await page.getByRole("link", { name: /view encounter/i }).first();

    // Verify URL contains organizationId and NOT facilityId
    expect(page.url()).toContain(`/organization/organizationId/patient/`);
    expect(page.url()).not.toContain("/facility/");

    // Wait for patient info hover card trigger
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();

    // Verify that Patient Home button is NOT visible (because facilityId is not available)
    await expect(
      page.getByRole("link", { name: "Patient Home" }),
    ).not.toBeVisible();

    // But View Profile button should still be visible
    await expect(page.getByRole("link", { name: "View Profile" })).toBeVisible({
      timeout: 5000,
    });
  });
});
