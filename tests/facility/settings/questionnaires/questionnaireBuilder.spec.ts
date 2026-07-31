import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 builder", () => {
  test("add a question, save, and preview it", async ({ page }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Builder ${Date.now()}`;
    const questionTitle = faker.lorem.words(3);

    await test.step("Create a questionnaire and open the builder", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
    });

    await test.step("Add a question", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
    });

    await test.step("Save changes", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Preview renders the question", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      await expect(page.getByText(questionTitle)).toBeVisible();
      await expect(page.getByPlaceholder("Enter details")).toBeVisible();
    });
  });
});
