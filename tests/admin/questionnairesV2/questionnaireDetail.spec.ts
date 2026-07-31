import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 detail", () => {
  test("open a questionnaire from the admin list and edit its title", async ({
    page,
  }) => {
    const title = `QV2 Detail ${Date.now()}`;

    await test.step("Create a questionnaire to own for this test", async () => {
      await page.goto("/admin/questionnaires/new");
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await page.getByRole("button", { name: "Save Form" }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/admin\/questionnaires\/[0-9a-f-]+$/);
      await expect(page.getByText("Form Properties")).toBeVisible();
    });

    await test.step("Edit title and save", async () => {
      const newTitle = `Edited ${faker.word.words(2)} ${Date.now()}`;
      await page.getByRole("textbox", { name: "Title" }).fill(newTitle);
      await page.getByRole("button", { name: "Save Form" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });
  });
});
