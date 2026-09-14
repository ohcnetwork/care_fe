import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import fs from "fs";
import os from "os";
import path from "path";
import {
  createQuestionnaire,
  openQuestionBuilder,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 import and clone", () => {
  test("importing JSON replaces the draft and cloning copies it to a new questionnaire", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Import ${Date.now()}`;
    const importedQuestionOneText = `${faker.word.words(2)} One ${Date.now()}`;
    const importedQuestionTwoText = `${faker.word.words(2)} Two ${Date.now()}`;

    const importPayload = {
      questions: [
        {
          text: importedQuestionOneText,
          type: "string",
          link_id: `Q-${faker.string.alphanumeric(8)}`,
        },
        {
          text: importedQuestionTwoText,
          type: "boolean",
          link_id: `Q-${faker.string.alphanumeric(8)}`,
        },
      ],
    };

    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "care-fe-questionnaire-import-"),
    );
    const importFilePath = path.join(tmpDir, "questionnaire-import.json");
    fs.writeFileSync(importFilePath, JSON.stringify(importPayload));

    let detailUrl = "";

    await test.step("Create a questionnaire", async () => {
      detailUrl = await createQuestionnaire(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
    });

    await test.step("Import the JSON file via the file dropzone", async () => {
      await openQuestionBuilder(page);

      await page.getByRole("button", { name: "Import Questions" }).click();
      await expect(
        page.getByRole("dialog", { name: "Import Questionnaire" }),
      ).toBeVisible();

      await page.locator('input[type="file"]').setInputFiles(importFilePath);

      await expect(page.getByText("Question count: 2")).toBeVisible();
      await expect(page.getByText("Warning", { exact: true })).toBeVisible();
      await expect(
        page.getByText("All existing data will be replaced"),
      ).toBeVisible();
    });

    await test.step("Confirm the import", async () => {
      await page.getByRole("button", { name: "Import", exact: true }).click();
      await expectToast(page, "Questionnaire Imported Successfully");

      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(importedQuestionOneText);
      await expect(
        page.getByRole("navigation").getByText(importedQuestionTwoText),
      ).toBeVisible();
    });

    await test.step("Save the imported questions", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Reloading the builder shows the imported questions persisted", async () => {
      await page.reload();
      await expect(
        page.getByRole("textbox", { name: "Question Title" }),
      ).toHaveValue(importedQuestionOneText);
      await expect(
        page.getByRole("navigation").getByText(importedQuestionTwoText),
      ).toBeVisible();
    });

    await test.step("Clone the questionnaire from its detail page", async () => {
      // The studio's Back is a real link (middle-click / new-tab support).
      await page.getByRole("link", { name: "Back" }).click();
      await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);

      await page.getByRole("button", { name: "Clone Questionnaire" }).click();
      const dialog = page.getByRole("dialog", { name: "Clone Questionnaire" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(
        `${title} (Copy)`,
      );

      await dialog.getByRole("button", { name: "Clone Questionnaire" }).click();
      await expectToast(page, "Questionnaire cloned successfully");
      // The source detail URL already matches the generic detail pattern, so
      // a plain regex wait would resolve immediately without ever navigating
      // — wait for the URL to actually change to a different (new) detail id.
      await page.waitForURL(
        (url) =>
          url.toString() !== detailUrl &&
          /\/settings\/questionnaires\/[0-9a-f-]+$/.test(url.pathname),
      );
    });

    await test.step("The clone landed on a new detail page with the copied title and questions", async () => {
      expect(page.url()).not.toBe(detailUrl);
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        `${title} (Copy)`,
      );
      await expect(
        page
          .getByRole("radiogroup", { name: "Status" })
          .getByRole("radio", { name: "Draft" }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByText(importedQuestionOneText)).toBeVisible();
      await expect(page.getByText(importedQuestionTwoText)).toBeVisible();
    });

    await test.step("The source questionnaire is unchanged", async () => {
      await page.goto(detailUrl);
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        title,
      );
      await expect(
        page
          .getByRole("radiogroup", { name: "Status" })
          .getByRole("radio", { name: "Active" }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByText(importedQuestionOneText)).toBeVisible();
      await expect(page.getByText(importedQuestionTwoText)).toBeVisible();
    });
  });
});
