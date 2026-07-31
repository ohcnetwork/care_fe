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

    await test.step("Fill and submit, picking a non-default subject type", async () => {
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      // "Encounter" is subjectTypeOptions[0] — already selected by default, so
      // clicking it again would exercise a no-op. Pick "Location" instead so
      // the assertion below actually pins subject_type selection taking effect.
      await page.getByRole("radio", { name: "Location", exact: true }).click();
      await page.getByRole("button", { name: "Save Questionnaire" }).click();
      await expectToast(page, "Questionnaire created successfully");
    });

    await test.step("Detail page shows the new questionnaire with the chosen subject type", async () => {
      await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        title,
      );
      await expect(page.getByText("Questionnaire Properties")).toBeVisible();

      // subject_type is create-only, so the detail sidebar renders it as a
      // static value (no radio group) under the Subject Type label.
      await expect(page.getByText("Subject Type")).toBeVisible();
      await expect(page.getByText("Location", { exact: true })).toBeVisible();
    });

    await test.step("List, scoped by search, shows it", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires`);
      await page.getByPlaceholder("Search Questionnaires").fill(title);
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        title,
      );
    });
  });
});
