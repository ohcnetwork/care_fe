import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaire } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 detail", () => {
  test("open a questionnaire from the admin list and edit its title", async ({
    page,
  }) => {
    const title = `QV2 Detail ${Date.now()}`;

    await test.step("Create a questionnaire to own for this test", async () => {
      await createQuestionnaire(page, {
        basePath: "/admin/questionnaires",
        title,
      });
      await expect(page.getByText("Questionnaire Properties")).toBeVisible();
    });

    let newTitle = "";

    await test.step("Edit title and save", async () => {
      newTitle = `Edited ${faker.word.words(2)} ${Date.now()}`;
      await page.getByRole("textbox", { name: "Title" }).fill(newTitle);
      await page.getByRole("button", { name: "Save Questionnaire" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Navigate list -> row -> detail and confirm the edit persisted", async () => {
      await page.goto("/admin/questionnaires");
      await page.getByPlaceholder("Search Questionnaires").fill(newTitle);

      // The table row's role is overridden to "link" (QuestionnaireListPage
      // wires role="link" + onClick on the TableRow), not the native "row".
      const row = page.getByRole("link").filter({ hasText: newTitle });
      await expect(row).toBeVisible();
      await row.click();

      await page.waitForURL(/\/admin\/questionnaires\/[0-9a-f-]+$/);
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        newTitle,
      );
    });
  });
});
