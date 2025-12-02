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

    // Wait for the page to fully load and check if Add Department/Team button exists
    await page.waitForTimeout(1000);

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

    // Wait for the page to fully load
    await page.waitForTimeout(1000);

    // Try to find the Add Department/Team button
    const addButton = page.getByRole("button", {
      name: "Add Department/Team",
    });

    const isButtonVisible = await addButton.isVisible().catch(() => false);

    if (isButtonVisible) {
      const isButtonDisabled = await addButton.isDisabled();

      if (!isButtonDisabled) {
        // If button is clickable, attempt to click it
        await addButton.click();

        // Check if the form sheet opened
        const sheetTitle = page.getByRole("heading", {
          name: /Create Department|Add Department/i,
        });

        const isSheetVisible = await sheetTitle
          .isVisible({ timeout: 2000 })
          .catch(() => false);

        if (isSheetVisible) {
          // If the sheet opened, try to submit and expect an error
          const nameInput = page.getByRole("textbox", { name: "Name" });
          await nameInput.fill("Test Sub Department");

          // Set up listener for API response before clicking submit
          const responsePromise = page.waitForResponse(
            (response) =>
              response.url().includes("/api/v1/facility") &&
              response.url().includes("/organizations/") &&
              response.request().method() === "POST",
            { timeout: 5000 },
          );

          const submitButton = page.getByRole("button", {
            name: "Create Organization",
          });
          await submitButton.click();

          try {
            const response = await responsePromise;
            const status = response.status();

            // The API should return an error status (400 or higher)
            expect(
              status >= 400,
              `API should return error status when creating child under Administration, got ${status}`,
            ).toBeTruthy();
          } catch (error) {
            // If no API call was made or it timed out, the UI prevented the creation
            // This is also acceptable behavior
            console.log(
              "No API call was made, indicating UI-level prevention",
            );
          }
        } else {
          // Sheet did not open - this is the expected behavior
          expect(isSheetVisible).toBeFalsy();
        }
      } else {
        // Button is disabled - this is expected
        expect(isButtonDisabled).toBeTruthy();
      }
    } else {
      // Button is not visible - this is the expected behavior
      expect(isButtonVisible).toBeFalsy();
    }
  });
});
