import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  departmentCards,
  selectDepartment,
} from "tests/helper/departmentSelect";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

async function getManageOrganizationSheet(page: Page) {
  const manageOrgSheet = page.getByRole("dialog").filter({
    has: page.getByRole("heading", { name: "Manage Organization" }),
  });

  await expect(manageOrgSheet).toBeVisible();
  return manageOrgSheet;
}

async function submitAddOrganization(
  manageOrgSheet: Awaited<ReturnType<typeof getManageOrganizationSheet>>,
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
    const manageOrgSheet = await getManageOrganizationSheet(page);
    await submitAddOrganization(manageOrgSheet);

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
    let manageOrgSheet = await getManageOrganizationSheet(page);

    // On first open, Administration should be pre-selected.
    await expect(manageOrgSheet).toContainText("Administration");

    await submitAddOrganization(manageOrgSheet);

    // After first add, slideover should auto-close.
    await expect(manageOrgSheet).not.toBeVisible();

    // Verify default organization is visible beside the Change button.
    await expect(
      managingOrgSection.getByRole("button", { name: "Change" }),
    ).toBeVisible();
    await expect(managingOrgSection.getByText("Administration")).toBeVisible();

    // Step 2: Reopen sheet and choose a different organization.
    await managingOrgSection.getByRole("button", { name: "Change" }).click();
    manageOrgSheet = await getManageOrganizationSheet(page);

    // Administration is already linked, so it is listed as current and is
    // not offered as a selection.
    await expect(
      manageOrgSheet.locator("span", { hasText: /^Administration$/ }).first(),
    ).toBeVisible();
    await expect(
      departmentCards(manageOrgSheet).filter({ hasText: "Administration" }),
    ).toHaveCount(0);

    const selectedDepartment = faker.helpers.arrayElement([
      "Urology",
      "Endocrinology",
      "ENT",
    ]);
    await selectDepartment(page, manageOrgSheet, selectedDepartment);

    // The newly selected department is the only selection.
    const selectedCards = departmentCards(manageOrgSheet);
    await expect(selectedCards).toHaveCount(1);
    await expect(selectedCards).toContainText(selectedDepartment);
    await expect(selectedCards).not.toContainText("Administration");

    await submitAddOrganization(manageOrgSheet);
    await expect(manageOrgSheet).not.toBeVisible();

    // Final state should show the newly selected organization beside Change.
    await expect(
      managingOrgSection.getByRole("button", { name: "Change" }),
    ).toBeVisible();
    await expect(
      managingOrgSection.getByText(selectedDepartment, { exact: false }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      managingOrgSection.getByText("Administration"),
    ).not.toBeVisible();
  });
});
