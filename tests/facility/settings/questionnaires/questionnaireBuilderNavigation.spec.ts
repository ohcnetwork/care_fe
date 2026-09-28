import { expect, test, type Page } from "@playwright/test";
import {
  createQuestionnaireAndOpenBuilder,
  questionBlock,
} from "tests/helper/questionnaireV2";
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
  test("canvas click selects a question; the floating toolbar reorders, duplicates and deletes", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const titles = [`Q One ${stamp}`, `Q Two ${stamp}`, `Q Three ${stamp}`];
    const titleInput = page.getByRole("textbox", { name: "Question Title" });
    const nav = page.getByRole("navigation");

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Canvas ${stamp}`,
    });
    await importStringQuestions(page, titles);

    await test.step("Import lands on question 1", async () => {
      await expect(titleInput).toHaveValue(titles[0]);
    });

    await test.step("Clicking a question card on the canvas selects it", async () => {
      // The card's inputs are inert on the edit canvas — the click lands on
      // the selection chrome. Aim at the label, which is never inert.
      await questionBlock(page, titles[1]).locator("label").click();
      await expect(titleInput).toHaveValue(titles[1]);
    });

    await test.step("Move question up via the floating toolbar", async () => {
      await page.getByRole("button", { name: "Move question up" }).click();
      await expect(nav.getByRole("button", { name: titles[1] })).toContainText(
        "1.",
      );
      await expect(nav.getByRole("button", { name: titles[0] })).toContainText(
        "2.",
      );
    });

    await test.step("Move question down restores the order", async () => {
      await page.getByRole("button", { name: "Move question down" }).click();
      await expect(nav.getByRole("button", { name: titles[0] })).toContainText(
        "1.",
      );
    });

    await test.step("Duplicate creates a selected copy right after", async () => {
      await page.getByRole("button", { name: "Duplicate question" }).click();
      await expect(titleInput).toHaveValue(`${titles[1]} (copy)`);
      await expect(
        nav.getByRole("button", { name: `${titles[1]} (copy)` }),
      ).toContainText("3.");
    });

    await test.step("The duplicate persists through save and reload", async () => {
      // Pins cloneSubtree's id/link_id regeneration server-side: a copy
      // reusing the source's ids would be rejected or collapse on save.
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.reload();
      await expect(
        nav.getByRole("button", { name: `${titles[1]} (copy)` }),
      ).toContainText("3.");
    });

    await test.step("Delete removes the copy via the toolbar", async () => {
      await questionBlock(page, `${titles[1]} (copy)`).locator("label").click();
      await page.getByRole("button", { name: "Delete question" }).click();
      await expect(
        nav.getByRole("button", { name: `${titles[1]} (copy)` }),
      ).not.toBeVisible();
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
