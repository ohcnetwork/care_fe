import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Organization Selector — Single Selection Mode", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("should only allow selecting one department when in single selection mode", async ({
    page,
  }) => {
    // Navigate to a healthcare service form which uses singleSelection={true}
    await page.goto(
      `/facility/${facilityId}/settings/services/healthcare-services/create`,
    );

    // Assert the org selector is present
    const orgSelector = page.getByRole("combobox", {
      name: /select department/i,
    });
    await expect(orgSelector).toBeVisible({ timeout: 5_000 });
    await orgSelector.click();

    // Assert the command input is visible using data-slot attribute
    const searchInput = page.locator('[data-slot="command-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Admin");

    // Wait for search results to appear
    const firstDept = page.locator('[data-slot="command-item"]').first();
    await expect(firstDept).toBeVisible({ timeout: 5_000 });

    const firstDeptText = await firstDept.textContent();
    expect(firstDeptText).not.toBeNull();
    await firstDept.click();

    // Use stable data-slot selector for selected orgs
    const selectedOrgs = page.locator('[data-slot="selected-org-item"]');
    await expect(selectedOrgs).toHaveCount(1, { timeout: 5_000 });

    // Verify the selected org name is visible — scoped to the selection area
    await expect(selectedOrgs.getByText(firstDeptText!.trim())).toBeVisible();
  });

  test("preferred auto-selection should respect single selection mode", async ({
    page,
  }) => {
    // Navigate to healthcare service form
    await page.goto(
      `/facility/${facilityId}/settings/services/healthcare-services/create`,
    );

    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");

    // Assert the org selector is present
    const orgSelector = page.getByRole("combobox", {
      name: /select department/i,
    });
    await expect(orgSelector).toBeVisible({ timeout: 5_000 });

    // Use stable data-slot selector for selected orgs
    const selectedOrgs = page.locator('[data-slot="selected-org-item"]');

    // In single selection mode: at most 1 org should be auto-selected.
    // If the test environment seeds preferred orgs, exactly 1 is expected.
    // If none are seeded, 0 is valid. Either way, > 1 was the bug.
    await expect(async () => {
      const count = await selectedOrgs.count();
      expect(count).toBeLessThanOrEqual(1);
    }).toPass({ timeout: 5_000 });
  });
});
