import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaire,
  openQuestionBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";

test.use({ storageState: "tests/.auth/user.json" });

const SAVE_BUTTON = /Save (Questionnaire|Form)/;

async function saveProperties(page: Page) {
  await page.getByRole("button", { name: SAVE_BUTTON }).click();
  await expectToast(page, "Questionnaire updated successfully");
}

/** Searches the admin list (Draft tab: new questionnaires default to
 *  Draft) by title and returns the matching row. */
async function adminListRow(page: Page, title: string) {
  await page.goto("/admin/questionnaires");
  await page
    .getByRole("radiogroup", { name: "Status" })
    .getByRole("radio", { name: "Draft" })
    .click();
  await page.getByPlaceholder("Search Questionnaires").fill(title);
  const row = page.getByRole("link").filter({ hasText: title });
  await expect(row).toBeVisible();
  return row;
}

test.describe("Questionnaire v2 detail", () => {
  test("title, slug and description edits keep the URL and show in the admin list", async ({
    page,
  }) => {
    const stamp = Date.now();
    const newTitle = `Edited ${faker.word.words(2)} ${stamp}`;
    const newSlug = `qv2-renamed-${stamp}`;
    const description = `Description ${faker.lorem.words(4)}`;
    let detailUrl = "";

    await test.step("Create a questionnaire to own for this test", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: "/admin/questionnaires",
        title: `QV2 Detail ${stamp}`,
      });
      await expect(page.getByText("Questionnaire Properties")).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Save (Questionnaire|Form)/ }),
      ).toBeDisabled();
    });

    await test.step("Edit title, slug and description; the URL does not move", async () => {
      await page.getByRole("textbox", { name: "Title" }).fill(newTitle);
      await page.getByRole("textbox", { name: "Slug" }).fill(newSlug);
      await page
        .getByRole("textbox", { name: "Description" })
        .fill(description);
      await saveProperties(page);
      await expect(
        page.getByRole("button", { name: SAVE_BUTTON }),
      ).toBeDisabled();
      await expect(page).toHaveURL(detailUrl);
    });

    await test.step("The admin list row shows the edits and opens the same URL", async () => {
      // The table row's role is overridden to "link" (QuestionnaireListPage
      // wires role="link" + onClick on the TableRow), not the native "row".
      const row = await adminListRow(page, newTitle);
      await expect(row).toContainText(newSlug);
      await expect(row).toContainText(description);
      await row.click();
      await expect(page).toHaveURL(detailUrl);
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        newTitle,
      );
      await expect(page.getByRole("textbox", { name: "Slug" })).toHaveValue(
        newSlug,
      );
      await expect(
        page.getByRole("textbox", { name: "Description" }),
      ).toHaveValue(description);
    });
  });

  test("a saved description can be cleared again", async ({ page }) => {
    const title = `QV2 Clear Description ${Date.now()}`;
    const description = `Description ${faker.lorem.words(4)}`;
    const descriptionInput = page.getByRole("textbox", { name: "Description" });
    let detailUrl = "";

    await test.step("Create a questionnaire with a description", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: "/admin/questionnaires",
        title,
      });
      await descriptionInput.fill(description);
      await saveProperties(page);
    });

    await test.step("Clear the description and save", async () => {
      await page.goto(detailUrl);
      await expect(descriptionInput).toHaveValue(description);
      await descriptionInput.clear();
      await saveProperties(page);
    });

    await test.step("The description stays empty after a reload and in the API", async () => {
      await page.goto(detailUrl);
      await expect(descriptionInput).toHaveValue("");
      const res = await fetch(
        `${apiBaseUrl()}/api/v1/questionnaire/${detailUrl.split("/").pop()}/`,
        { headers: adminApiHeaders() },
      );
      expect(res.ok).toBe(true);
      const data = (await res.json()) as { description: string | null };
      expect(data.description ?? "").toBe("");
    });

    await test.step("The admin list row no longer carries it", async () => {
      const row = await adminListRow(page, title);
      await expect(row).not.toContainText(description);
    });
  });

  test("clearing the title of a saved questionnaire blocks the save", async ({
    page,
  }) => {
    const title = `QV2 Required Title ${Date.now()}`;
    const puts: string[] = [];
    page.on("request", (request) => {
      if (
        request.method() === "PUT" &&
        request.url().includes("/api/v1/questionnaire/")
      ) {
        puts.push(request.url());
      }
    });

    const detailUrl = await createQuestionnaire(page, {
      basePath: "/admin/questionnaires",
      title,
    });

    await page.getByRole("textbox", { name: "Title" }).clear();
    await page.getByRole("button", { name: SAVE_BUTTON }).click();
    await expect(page.getByText("This field is required")).toBeVisible();
    expect(puts).toHaveLength(0);

    await page.goto(detailUrl);
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
      title,
    );
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
