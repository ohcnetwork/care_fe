import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Manage departments/teams association to an encounter", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
    await page.getByText("View Encounter").first().click();
    await openDepartmentsDialog(page);
  });

  async function openDepartmentsDialog(page: Page) {
    await page.getByRole("tab", { name: "Actions" }).click();
    await page.getByRole("button", { name: "Update Department" }).click();
  }

  async function deleteOrganization(page: Page) {
    await page
      .locator("button")
      .filter({ has: page.locator(".lucide-trash-2") })
      .first()
      .click();
  }

  async function verifyDeleteSuccess(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Organization removed successfully"),
    ).toBeVisible({ timeout: 10000 });
  }

  async function selectAllOrganizationsTab(page: Page) {
    await page.getByRole("tab", { name: "All Organizations" }).click();
    await page.getByRole("combobox").click();
  }

  async function selectDepartment(page: Page, departmentName?: string) {
    // Select specific department or first available department from dropdown
    if (departmentName) {
      await page.getByRole("option", { name: departmentName }).click();
    } else {
      await page.getByRole("option").first().click();
    }
  }

  async function submitAddOrganization(page: Page) {
    await page.getByRole("button", { name: "Add Organizations" }).click();
  }

  async function verifyOrganizationAdded(page: Page) {
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Organization added successfully"),
    ).toBeVisible({ timeout: 10000 });
  }

  test("Delete organization from encounter", async ({ page }) => {
    // Delete the organization
    await deleteOrganization(page);
    await verifyDeleteSuccess(page);
  });

  test("Add additional organization to existing encounter", async ({
    page,
  }) => {
    // Select all organizations tab and open dropdown
    await selectAllOrganizationsTab(page);

    // Select department from dropdown
    await selectDepartment(page);

    await submitAddOrganization(page);
    await verifyOrganizationAdded(page);
  });
});
