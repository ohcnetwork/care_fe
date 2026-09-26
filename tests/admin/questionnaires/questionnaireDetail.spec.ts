import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createQuestionnaire,
  openQuestionBuilder,
} from "tests/helper/questionnaireV2";
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
      await expect(
        page.getByRole("button", { name: /Save (Questionnaire|Form)/ }),
      ).toBeDisabled();
    });

    let newTitle = "";

    await test.step("Edit title and save", async () => {
      newTitle = `Edited ${faker.word.words(2)} ${Date.now()}`;
      await page.getByRole("textbox", { name: "Title" }).fill(newTitle);
      await page
        .getByRole("button", { name: /Save (Questionnaire|Form)/ })
        .click();
      await expectToast(page, "Questionnaire updated successfully");
      await expect(
        page.getByRole("button", { name: /Save (Questionnaire|Form)/ }),
      ).toBeDisabled();
    });

    await test.step("Navigate list -> row -> detail and confirm the edit persisted", async () => {
      await page.goto("/admin/questionnaires");
      await page
        .getByRole("radiogroup", { name: "Status" })
        .getByRole("radio", { name: "Draft" })
        .click();
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

  test("a successful reorder after a failed save preserves unsaved metadata", async ({
    page,
  }) => {
    const title = `Failed metadata save ${Date.now()}`;
    const detailUrl = await createQuestionnaire(page, {
      basePath: "/admin/questionnaires",
      title,
    });
    await openQuestionBuilder(page);
    await page.getByRole("button", { name: "Import Questions" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "reorder.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          questions: [
            { text: "First question", type: "string", link_id: "first" },
            { text: "Second question", type: "string", link_id: "second" },
          ],
        }),
      ),
    });
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire updated successfully");
    await page.goto(detailUrl);
    const unsavedTitle = `${title} edited`;
    await page.getByRole("textbox", { name: "Title" }).fill(unsavedTitle);
    const id = new URL(detailUrl).pathname.split("/").at(-1);
    let rejectNextUpdate = true;
    await page.route(`**/api/v1/questionnaire/${id}/`, async (route) => {
      if (route.request().method() === "PUT" && rejectNextUpdate) {
        rejectNextUpdate = false;
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Rejected for regression test" }),
        });
      } else await route.continue();
    });
    await test.step("The failed metadata save keeps the draft", async () => {
      await page
        .getByRole("button", { name: /Save (Questionnaire|Form)/ })
        .click();
      await expectToast(page, "Rejected for regression test");
      await expect(
        page.getByRole("button", { name: /Save (Questionnaire|Form)/ }),
      ).toBeEnabled();
    });
    await test.step("Reordering does not mark that metadata as saved", async () => {
      await page.getByRole("button", { name: "More options" }).first().click();
      await page.getByRole("menuitem", { name: "Move Down" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        unsavedTitle,
      );
      await expect(
        page.getByRole("button", { name: /Save (Questionnaire|Form)/ }),
      ).toBeEnabled();
    });
  });
});
