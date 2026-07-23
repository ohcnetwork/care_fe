import { expect, test } from "@playwright/test";

import { navigateToOrganizationPatient } from "tests/organization/patient/helpers";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("PatientInfoHoverCard Conditional Rendering", () => {
  test("should NOT show Patient Home button in encounter accessed via organization route", async ({
    page,
  }) => {
    await navigateToOrganizationPatient(page);

    // Go to Encounters tab
    await page.getByRole("tab", { name: "Encounters" }).click();

    // Click "View Encounter" link
    await page.getByRole("link", { name: "View Encounter" }).first().click();

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
