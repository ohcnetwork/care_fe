import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Prevent Creating Sub-Department/Team Under Administration", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/departments`);
  });

  async function searchDepartment(page: Page, departmentName: string) {
    await page
      .getByRole("textbox", { name: "Search by department/team name" })
      .fill(departmentName);
  }

  async function openDepartment(page: Page, departmentName: string) {
    await searchDepartment(page, departmentName);
    await page.getByRole("row").filter({ hasText: departmentName }).click();
  }

  test("Verify Add Department/Team button is hidden or disabled for Administration department", async ({
    page,
  }) => {
    // Navigate to Administration department
    await openDepartment(page, "Administration");

    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");

    // Check if the "Add Department/Team" button is visible
    const addButton = page.getByRole("button", {
      name: "Add Department/Team",
    });

    const isButtonVisible = await addButton.isVisible({ timeout: 0 });
    const isButtonDisabled = isButtonVisible
      ? await addButton.isDisabled()
      : true;

    // Assert that the button is either hidden or disabled
    expect(
      !isButtonVisible || isButtonDisabled,
      "Add Department/Team button should be hidden or disabled for Administration department",
    ).toBeTruthy();
  });

  test("Verify attempting to create sub-department under Administration fails or is blocked", async ({
    page,
  }) => {
    // Navigate to Administration department
    await openDepartment(page, "Administration");
    await page.waitForLoadState("networkidle");

    // Check if the Add Department/Team button exists and is enabled
    const addButton = page.getByRole("button", {
      name: "Add Department/Team",
    });

    // The button should either not be visible or be disabled
    const isButtonVisible = await addButton.isVisible({ timeout: 0 });

    if (!isButtonVisible) {
      // Button is hidden - expected behavior, test passes
      return;
    }

    const isButtonDisabled = await addButton.isDisabled();

    if (isButtonDisabled) {
      // Button is disabled - expected behavior, test passes
      expect(isButtonDisabled).toBeTruthy();
      return;
    }

    // If we reach here, button is visible and enabled - try to click it and expect the sheet does NOT open
    await addButton.click();

    // Assert that the create sheet does NOT open (heading is not visible within timeout)
    const sheetTitle = page.getByRole("heading", {
      name: /Create Department|Add Department/i,
    });
    await expect(sheetTitle).not.toBeVisible({ timeout: 2000 });
  });
});
