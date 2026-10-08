import { test, expect } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

/**
 * Accessibility test for Facility General Settings page.
 * Verifies that all interactive elements have accessible names and are keyboard focusable.
 */
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Facility General Settings Accessibility", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("All interactive elements have accessible names and are focusable", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/settings/general`);
    // Check Edit Cover Photo button
    const editButton = page.getByRole("button", { name: /edit cover photo/i });
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
    await editButton.focus();
    await expect(editButton).toBeFocused();
    // Check that the configurations button is accessible
    const configButton = page.getByRole("button", { name: /configurations/i });
    await expect(configButton).toBeVisible();
    await expect(configButton).toBeEnabled();
    await configButton.focus();
    await expect(configButton).toBeFocused();
    // Check that the edit facility details button is accessible
    const editDetailsButton = page.getByRole("button", { name: /edit facility details/i });
    await expect(editDetailsButton).toBeVisible();
    await expect(editDetailsButton).toBeEnabled();
    await editDetailsButton.focus();
    await expect(editDetailsButton).toBeFocused();
  });
});
