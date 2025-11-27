import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("PatientInfoHoverCard Conditional Rendering", () => {
  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/encounters/patients/all`);
  });

  test("should not show Patient Home button on patient home page", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Patient Home" }).first().click();

    // Wait for patient info hover card trigger
    await page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .last()
      .click();

    // Verify that Patient Home button is NOT visible (because its home page)
    await expect(
      page.getByRole("link", { name: "Patient Home" }),
    ).not.toBeVisible();

    // But View Profile button should still be visible
    await expect(page.getByRole("link", { name: "View Profile" })).toBeVisible({
      timeout: 5000,
    });
  });
});
