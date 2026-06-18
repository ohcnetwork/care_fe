import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

function getManageOrganizationSheet(page: Page) {
  return page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: "Manage Organization" }),
  });
}

async function submitAddOrganization(
  page: Page,
  manageOrgSheet: ReturnType<typeof getManageOrganizationSheet>,
) {
  const addOrganizationButton = manageOrgSheet.getByRole("button", {
    name: "Add Organization",
  });
  await expect(addOrganizationButton).toBeVisible();
  await expect(addOrganizationButton).toBeEnabled();
  await addOrganizationButton.scrollIntoViewIfNeeded();

  try {
    await addOrganizationButton.click({ timeout: 5000 });
  } catch {
    await addOrganizationButton.focus();
    await addOrganizationButton.press("Enter");
  }
}

test.describe("Device Organization Association", () => {
  let facilityId: string;
  let deviceName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    deviceName = faker.commerce.productName();

    // Create a device first
    await page.goto(`/facility/${facilityId}/settings/devices`);
    await page.getByRole("link", { name: "Add Device" }).click();
    await page
      .getByRole("textbox", { name: "Registered Name *" })
      .fill(deviceName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Device registered successfully"),
    ).toBeVisible();

    // Navigate to the device details page
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(deviceName);
    await page.getByRole("link", { name: deviceName }).click();
  });

  test("should display no organization associated message when device has no organization", async ({
    page,
  }) => {
    // Check for no organization message
    await expect(page.getByText("No organization associated")).toBeVisible();
  });

  test("should open organization association sheet", async ({ page }) => {
    // Click associate button for organization - find by Managing Organization heading
    await page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    // Sheet should open
    await expect(
      page.getByRole("heading", { name: "Manage Organization" }),
    ).toBeVisible();
  });

  test("should associate an organization to device", async ({ page }) => {
    // Click associate button for organization - find by Managing Organization heading
    await page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    // Wait for the sheet to open
    await expect(
      page.getByRole("heading", { name: "Manage Organization" }),
    ).toBeVisible();

    // Administration is pre-selected by default, click Add Organization
    const manageOrgSheet = getManageOrganizationSheet(page);
    await submitAddOrganization(page, manageOrgSheet);

    // Organization should now be associated on the details section.
    const managingOrgSection = page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..");
    await expect(
      managingOrgSection.getByRole("button", { name: "Change" }),
    ).toBeVisible();
    await expect(
      page.getByText("No organization associated"),
    ).not.toBeVisible();
  });

  test("should allow changing organization associated with device", async ({
    page,
  }) => {
    const managingOrgSection = page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..");

    // Step 1: Associate default organization so Change action is available.
    await managingOrgSection.getByRole("button", { name: "Associate" }).click();
    let manageOrgSheet = getManageOrganizationSheet(page);
    await expect(manageOrgSheet).toBeVisible();
    await submitAddOrganization(page, manageOrgSheet);
    await expect(
      managingOrgSection.getByRole("button", { name: "Change" }),
    ).toBeVisible();

    // Step 2: Reopen sheet and choose a different organization if available.
    if (await manageOrgSheet.isVisible()) {
      await page.keyboard.press("Escape");
      await expect(manageOrgSheet).not.toBeVisible();
    }

    await managingOrgSection.getByRole("button", { name: "Change" }).click();
    manageOrgSheet = getManageOrganizationSheet(page);
    await expect(manageOrgSheet).toBeVisible();

    await manageOrgSheet
      .getByRole("tab", { name: "All Organizations" })
      .click();
    await manageOrgSheet
      .locator('[data-slot="popover-trigger"]')
      .first()
      .click();

    const departmentItems = page.locator('[data-slot="command-item"]');
    await expect(departmentItems.first()).toBeVisible();

    const nonAdminDepartmentItems = departmentItems.filter({
      hasNotText: /Administration/i,
    });
    await expect(
      nonAdminDepartmentItems.first(),
      "Expected at least one department option other than Administration",
    ).toBeVisible();

    const optionCount = await nonAdminDepartmentItems.count();
    const randomOption = nonAdminDepartmentItems.nth(
      faker.number.int({ min: 0, max: optionCount - 1 }),
    );
    await randomOption.click();

    // Ensure popover is closed before submission to prevent click interception.
    if (await departmentItems.first().isVisible()) {
      await page.keyboard.press("Escape");
      await expect(departmentItems.first()).toBeHidden();
    }

    await submitAddOrganization(page, manageOrgSheet);

    // Final state should remain associated and expose Change action.
    await expect(
      managingOrgSection.getByRole("button", { name: "Change" }),
    ).toBeVisible();
    await expect(
      page.getByText("No organization associated"),
    ).not.toBeVisible();
    await expect(
      managingOrgSection.getByText("Administration"),
    ).not.toBeVisible({ timeout: 15_000 });
  });
});
