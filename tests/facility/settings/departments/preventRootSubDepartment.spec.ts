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

    const isButtonVisible = await addButton.isVisible().catch(() => false);
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
    const isButtonVisible = await addButton.isVisible().catch(() => false);

    if (!isButtonVisible) {
      // Button is hidden - expected behavior, test passes
      expect(isButtonVisible).toBeFalsy();
      return;
    }

    const isButtonDisabled = await addButton.isDisabled();

    if (isButtonDisabled) {
      // Button is disabled - expected behavior, test passes
      expect(isButtonDisabled).toBeTruthy();
      return;
    }

    // If we reach here, button is visible and enabled - try to use it and expect failure
    await addButton.click();

    // Wait for the create sheet to open
    const sheetTitle = page.getByRole("heading", {
      name: /Create Department|Add Department/i,
    });
    await expect(sheetTitle).toBeVisible({ timeout: 2000 });

    // Fill in the name field
    const nameInput = page.getByRole("textbox", { name: "Name" });
    await nameInput.pressSequentially("Test Sub Department");

    // Set up listener for API response
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/facility") &&
        response.url().includes("/organizations/") &&
        response.request().method() === "POST",
      { timeout: 5000 },
    );

    // Click submit
    const submitButton = page.getByRole("button", {
      name: "Create Organization",
    });
    await submitButton.click();

    // Verify API returns error status
    const response = await responsePromise;
    const status = response.status();

    expect(status >= 400).toBeTruthy();
  });
});
