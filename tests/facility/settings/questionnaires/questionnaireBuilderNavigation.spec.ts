import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/** Imports flat string questions into the freshly-opened builder. */
async function importStringQuestions(
  page: Page,
  titles: string[],
): Promise<void> {
  await page.getByRole("button", { name: "Import Questions" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "scaffold.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        questions: titles.map((text, index) => ({
          text,
          type: "string",
          link_id: `q-${index}`,
        })),
      }),
    ),
  });
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expectToast(page, "Questionnaire Imported Successfully");
}

test.describe("Questionnaire v2 builder navigation", () => {
  test("footer Previous/Next walk the top-level questions while editing", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const titles = [`Q One ${stamp}`, `Q Two ${stamp}`, `Q Three ${stamp}`];
    const titleInput = page.getByRole("textbox", { name: "Question Title" });
    const previous = page.getByRole("button", { name: "Previous" });
    const next = page.getByRole("button", { name: "Next" });

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Footer ${stamp}`,
    });
    await importStringQuestions(page, titles);

    await test.step("Import lands on question 1 with Previous disabled", async () => {
      await expect(titleInput).toHaveValue(titles[0]);
      await expect(previous).toBeDisabled();
      await expect(next).toBeEnabled();
    });

    await test.step("Next steps forward to the last question", async () => {
      await next.click();
      await expect(titleInput).toHaveValue(titles[1]);
      await next.click();
      await expect(titleInput).toHaveValue(titles[2]);
      await expect(next).toBeDisabled();
    });

    await test.step("Previous steps back again", async () => {
      await previous.click();
      await expect(titleInput).toHaveValue(titles[1]);
      await expect(previous).toBeEnabled();
    });
  });

  test("tree nav selects rows and the separator inserts a question between", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const titles = [`First ${stamp}`, `Last ${stamp}`];
    const nav = page.getByRole("navigation");
    const titleInput = page.getByRole("textbox", { name: "Question Title" });

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 TreeNav ${stamp}`,
    });
    await importStringQuestions(page, titles);

    await test.step("Clicking a nav row selects that question", async () => {
      await nav.getByRole("button", { name: titles[1] }).click();
      await expect(titleInput).toHaveValue(titles[1]);
      await nav.getByRole("button", { name: titles[0] }).click();
      await expect(titleInput).toHaveValue(titles[0]);
    });

    await test.step("The separator + inserts an untitled question between", async () => {
      // Inside the nav, separator "+" buttons come before the footer link —
      // with two questions there is exactly one separator, and it is first.
      await nav
        .getByRole("button", { name: "Add new question" })
        .first()
        .click();
      await expect(titleInput).toHaveValue("");
      const inserted = nav.getByRole("button", { name: "Untitled Question" });
      await expect(inserted).toBeVisible();
      await expect(inserted).toContainText("2.");
      await expect(nav.getByRole("button", { name: titles[1] })).toContainText(
        "3.",
      );
    });
  });

  test("a top-level question deletes via the editor kebab", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const titles = [`Keep me ${stamp}`, `Delete me ${stamp}`];
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Delete ${stamp}`,
    });
    await importStringQuestions(page, titles);

    await test.step("Delete the second question", async () => {
      await nav.getByRole("button", { name: titles[1] }).click();
      await page.getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Delete question" }).click();
      await expect(
        nav.getByRole("button", { name: titles[1] }),
      ).not.toBeVisible();
    });

    await test.step("The survivor renumbers and the delete persists on save", async () => {
      await expect(nav.getByRole("button", { name: titles[0] })).toContainText(
        "1.",
      );
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.reload();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(titles[0]);
      await expect(
        nav.getByRole("button", { name: titles[1] }),
      ).not.toBeVisible();
    });
  });
});
