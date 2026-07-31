import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 create (facility)", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await page.goto(`/facility/${facilityId}/settings/questionnaires`);
  });

  test("create a facility questionnaire and land on its detail page", async ({
    page,
  }) => {
    const title = `QV2 ${faker.word.words(2)} ${Date.now()}`;

    await test.step("Open create form", async () => {
      await page.getByRole("button", { name: "Create Questionnaire" }).click();
      await page.waitForURL(/\/settings\/questionnaires\/new$/);
    });

    await test.step("Fill and submit", async () => {
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await page.getByRole("radio", { name: "Encounter", exact: true }).click();
      await page.getByRole("button", { name: "Save Form" }).click();
      await expectToast(page, "Questionnaire created successfully");
    });

    await test.step("Detail page shows the new questionnaire", async () => {
      await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        title,
      );
      await expect(page.getByText("Form Properties")).toBeVisible();
    });

    await test.step("List shows it", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires`);
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        title,
      );
    });
  });
});
