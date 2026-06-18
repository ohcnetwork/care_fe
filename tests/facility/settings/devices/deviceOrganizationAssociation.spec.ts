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

    // Should show success message
    await expect(
      page.getByText(/Organization added successfully/i),
    ).toBeVisible();

    // Organization should now be displayed
    await expect(
      page.getByText("No organization associated"),
    ).not.toBeVisible();
  });

  test("should allow changing organization associated with device", async ({
    page,
  }) => {
    // First associate an organization - find by Managing Organization heading
    await page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..")
      .getByRole("button", { name: "Associate" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Manage Organization" }),
    ).toBeVisible();

    // Administration is pre-selected by default, click Add Organization
    let manageOrgSheet = getManageOrganizationSheet(page);
    await submitAddOrganization(page, manageOrgSheet);

    await expect(
      page.getByText(/Organization added successfully/i),
    ).toBeVisible();

    manageOrgSheet = getManageOrganizationSheet(page);
    // Some environments auto-close the sheet after successful association.
    if (await manageOrgSheet.isVisible()) {
      await page.keyboard.press("Escape");
      await expect(manageOrgSheet).not.toBeVisible();
    }

    // Open the sheet again to change organization
    await page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..")
      .getByRole("button", { name: "Change" })
      .click();

    // Should show current organization
    await expect(
      manageOrgSheet.getByText("Current Organization"),
    ).toBeVisible();
    await expect(
      manageOrgSheet.getByText("Administration").first(),
    ).toBeVisible();

    // Click "All Organizations" tab to see more options
    await manageOrgSheet
      .getByRole("tab", { name: "All Organizations" })
      .click();

    // Click the Select Department dropdown (using popover-trigger)
    await manageOrgSheet
      .locator('[data-slot="popover-trigger"]')
      .filter({ hasText: "Select Department" })
      .click();

    // Pick an organization that's not the current one to avoid no-op updates.
    const departmentItems = page.locator('[data-slot="command-item"]');
    await expect(departmentItems.first()).toBeVisible();

    const itemCount = await departmentItems.count();
    let selectedOrganizationName = "";
    for (let index = 0; index < itemCount; index++) {
      const item = departmentItems.nth(index);
      const itemText = (await item.innerText()).trim();
      if (!/administration/i.test(itemText)) {
        selectedOrganizationName = itemText.split("\n")[0].trim();
        await item.click();
        break;
      }
    }

    if (!selectedOrganizationName) {
      // Fallback for datasets with a single available organization.
      selectedOrganizationName = "Administration";
      await departmentItems.first().click();
    }

    // Dismiss any open popover before submit to avoid click interception.
    await manageOrgSheet
      .getByRole("tab", { name: "All Organizations" })
      .click();
    await expect(departmentItems.first()).toBeHidden();

    // Click Add Organization
    await submitAddOrganization(page, manageOrgSheet);

    // Should show success message
    await expect(
      page.getByText(/Organization added successfully/i),
    ).toBeVisible();

    // Verify the Managing Organization section shows the new organization, not Administration
    const managingOrgSection = page
      .getByRole("heading", { name: "Managing Organization" })
      .locator("..");
    if (selectedOrganizationName !== "Administration") {
      await expect(
        managingOrgSection.getByText("Administration"),
      ).not.toBeVisible();
      await expect(
        managingOrgSection.getByText(selectedOrganizationName, {
          exact: false,
        }),
      ).toBeVisible();
    }
    await expect(
      managingOrgSection.getByRole("button", { name: "Change" }),
    ).toBeVisible();
  });
});
