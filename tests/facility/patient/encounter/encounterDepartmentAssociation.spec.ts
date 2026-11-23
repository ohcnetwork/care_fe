import { expect, test, type Page } from "@playwright/test";
import { format, subDays } from "date-fns";
import { selectFirstAvailableDepartment } from "tests/helper/departmentSelect";
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
    // Pick a department that is not already linked to the encounter
    await selectFirstAvailableDepartment(
      page,
      page.getByRole("dialog").filter({
        has: page.getByRole("heading", { name: "Manage Organizations" }),
      }),
    );

    await submitAddOrganization(page);
    await verifyOrganizationAdded(page);
  });
});
