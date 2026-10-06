import { test, expect } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("BackButton accessibility", () => {
  let facilityId: string;
  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test("Back button has accessible name and is keyboard focusable", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/patients`);
    await page.getByRole("button", { name: /add new patient/i }).click();
    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible();
    // Check accessible name
    await expect(backButton).toHaveAccessibleName(/back/i);
    // Check keyboard focus
    await backButton.focus();
    await expect(backButton).toBeFocused();
  });
});
