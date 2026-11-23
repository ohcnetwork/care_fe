import { expect, test } from "@playwright/test";
import { selectFirstAvailableDepartment } from "tests/helper/departmentSelect";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { expectToast } from "tests/helper/ui";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Manage departments/teams association to an encounter", () => {
  test.beforeEach(async ({ page, request }) => {
    const facilityId = getFacilityId();
    const response = await request.get(
      `${getApiUrl()}/api/v1/facility/${facilityId}/organizations/?limit=1`,
      { headers: getApiHeaders() },
    );
    await expect(response).toBeOK();
    const { results } = (await response.json()) as {
      results: { id: string }[];
    };
    const [department] = results;
    expect(department, "The facility needs a department").toBeDefined();
    const { patientId, encounterId } = await createQuestionnaireEncounter(
      facilityId,
      { organizations: [department.id] },
    );

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );
    await page.getByRole("tab", { name: "Actions" }).click();
    await page
      .getByRole("tabpanel", { name: "Actions" })
      .getByRole("button", { name: "Update Department" })
      .click();
  });

  test("Delete organization from encounter", async ({ page }) => {
    const sheet = page.getByRole("dialog", { name: "Manage Organizations" });
    await sheet
      .getByRole("button")
      .filter({ has: page.locator(".lucide-trash-2") })
      .click();
    await expectToast(page, "Organization removed successfully");
    await expect(sheet.getByText("No organizations added yet")).toBeVisible();
  });

  test("Add additional organization to existing encounter", async ({
    page,
  }) => {
    const sheet = page.getByRole("dialog", { name: "Manage Organizations" });
    await selectFirstAvailableDepartment(page, sheet);
    await sheet.getByRole("button", { name: "Add Organizations" }).click();
    await expectToast(page, "Organization added successfully");
  });
});
