import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 repeats", () => {
  test("choice question with Repeats becomes multi-select chips in preview", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Repeats Choice ${Date.now()}`;
    const questionTitle = `${faker.word.words(2)} Symptoms ${Date.now()}`;
    const optionAValue = `opt-a-${faker.string.alphanumeric(4).toLowerCase()}`;
    const optionBValue = `opt-b-${faker.string.alphanumeric(4).toLowerCase()}`;

    await test.step("Create a questionnaire and open the builder", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
    });

    await test.step("Add a choice question with two options and Repeats on", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
      // The type picker is the only combobox on screen for a freshly-added
      // question (AnswerOptionsEditor/SubQuestionsList aren't rendered yet).
      await page.getByRole("combobox").click();
      await page.getByRole("option", { name: "Choice" }).click();

      await page.getByRole("button", { name: "Add Option" }).click();
      await page.getByRole("button", { name: "Add Option" }).click();

      const rows = page.getByRole("row");
      await rows.nth(1).getByRole("textbox").fill(optionAValue);
      await rows.nth(2).getByRole("textbox").fill(optionBValue);

      // Behaviour chips render inline on the inspector's Question tab.
      await page.getByRole("checkbox", { name: "Repeatable" }).click();
      await expect(
        page.getByRole("checkbox", { name: "Repeatable" }),
      ).toHaveAttribute("aria-checked", "true");
    });

    await test.step("Save changes", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Preview: both chips toggle on and stay selected", async () => {
      await page.getByRole("button", { name: "Preview" }).click();

      const chipA = page.getByRole("checkbox", { name: optionAValue });
      const chipB = page.getByRole("checkbox", { name: optionBValue });
      await expect(chipA).toBeVisible();
      await expect(chipB).toBeVisible();

      await chipA.click();
      await chipB.click();
      await expect(chipA).toHaveAttribute("aria-checked", "true");
      await expect(chipB).toHaveAttribute("aria-checked", "true");
    });

    await test.step("Preview: toggling one chip off keeps the other selected", async () => {
      const chipA = page.getByRole("checkbox", { name: optionAValue });
      const chipB = page.getByRole("checkbox", { name: optionBValue });

      await chipA.click();
      await expect(chipA).toHaveAttribute("aria-checked", "false");
      await expect(chipB).toHaveAttribute("aria-checked", "true");
    });
  });

  test("text question with Repeats supports adding and removing entries in preview", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Repeats Text ${Date.now()}`;
    const questionTitle = `${faker.word.words(2)} Notes ${Date.now()}`;
    const firstValue = `first-${faker.string.alphanumeric(6)}`;
    const secondValue = `second-${faker.string.alphanumeric(6)}`;

    await test.step("Create a questionnaire and open the builder", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
    });

    await test.step("Add a repeating text question", async () => {
      // A freshly-added question defaults to the String type — only the
      // Repeats behaviour flag needs turning on.
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);

      await page.getByRole("checkbox", { name: "Repeatable" }).click();
    });

    await test.step("Save changes", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Preview: Add Another adds a second entry and both accept text", async () => {
      await page.getByRole("button", { name: "Preview" }).click();

      const inputs = page.getByPlaceholder("Enter details");
      await expect(inputs).toHaveCount(1);

      await page.getByRole("button", { name: "Add Another" }).click();
      await expect(inputs).toHaveCount(2);

      await inputs.nth(0).fill(firstValue);
      await inputs.nth(1).fill(secondValue);
      await expect(inputs.nth(0)).toHaveValue(firstValue);
      await expect(inputs.nth(1)).toHaveValue(secondValue);
    });

    await test.step("Preview: removing an entry deletes only that entry", async () => {
      const inputs = page.getByPlaceholder("Enter details");

      await page.getByRole("button", { name: "Remove" }).first().click();
      await expect(inputs).toHaveCount(1);
      await expect(inputs.first()).toHaveValue(secondValue);
    });
  });
});
