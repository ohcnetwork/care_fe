import { expect, test, type Page } from "@playwright/test";
import { selectFirstAvailableDepartment } from "tests/helper/departmentSelect";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Manage departments/teams association to an encounter", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;

  // Each test gets its own encounter. Other specs create in-progress
  // encounters without departments, so "the first encounter in the list"
  // may have nothing to remove.
  test.beforeEach(async () => {
    facilityId = getFacilityId();
    ({ patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId));
  });

  const dialog = (page: Page) =>
    page.getByRole("dialog", { name: "Manage Organizations" });

  async function openDepartmentsDialog(page: Page) {
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );
    await page.getByRole("tab", { name: "Actions" }).click();
    await page
      .getByRole("tabpanel", { name: "Actions" })
      .getByRole("button", { name: "Update Department" })
      .click();
    await expect(dialog(page)).toBeVisible();
  }

  test("Delete organization from encounter", async ({ page, request }) => {
    const name = `Encounter department ${Date.now()}`;
    const created = await request.post(
      `${apiBaseUrl()}/api/v1/facility/${facilityId}/organizations/`,
      {
        headers: adminApiHeaders(),
        data: { name, org_type: "dept", facility: facilityId },
      },
    );
    expect(created.ok(), await created.text()).toBe(true);
    const organization = (await created.json()) as { id: string };
    const linked = await request.post(
      `${apiBaseUrl()}/api/v1/encounter/${encounterId}/organizations_add/`,
      {
        headers: adminApiHeaders(),
        data: { organization: organization.id },
      },
    );
    expect(linked.ok(), await linked.text()).toBe(true);

    await openDepartmentsDialog(page);
    // The current departments list renders each one as a row with its name
    // and a trash button.
    const row = dialog(page)
      .locator("div")
      .filter({ has: page.getByText(name, { exact: true }) })
      .filter({ has: page.locator(".lucide-trash-2") });
    await row.last().getByRole("button").click();
    await expectToast(page, "Organization removed successfully");
    await expect(row).toHaveCount(0);
    await expect(
      dialog(page).getByText("No organizations added yet"),
    ).toBeVisible();
  });

  test("Add additional organization to existing encounter", async ({
    page,
  }) => {
    await openDepartmentsDialog(page);
    await selectFirstAvailableDepartment(page, dialog(page));
    await dialog(page)
      .getByRole("button", { name: "Add Organizations" })
      .click();
    await expectToast(page, "Organization added successfully");
  });
});
