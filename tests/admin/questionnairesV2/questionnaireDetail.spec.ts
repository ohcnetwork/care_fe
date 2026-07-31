import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 detail", () => {
  test("open a questionnaire from the admin list and edit its title", async ({
    page,
  }) => {
    await page.goto("/admin/questionnaires");

    await test.step("Open first questionnaire", async () => {
      await page.locator('[data-slot="table-body"] tr').first().click();
      await page.waitForURL(/\/admin\/questionnaires\/[^/]+$/);
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
