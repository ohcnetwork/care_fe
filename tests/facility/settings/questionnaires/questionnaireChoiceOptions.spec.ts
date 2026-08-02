import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createQuestionnaireAndOpenBuilder,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 choice answer options", () => {
  test("custom choice options round-trip through the builder into preview and the detail overview", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const title = `QV2 Choice ${Date.now()}`;
    const questionTitle = `${faker.word.words(2)} Severity ${Date.now()}`;
    const optionAValue = `mild-${faker.string.alphanumeric(4).toLowerCase()}`;
    const optionBValue = `severe-${faker.string.alphanumeric(4).toLowerCase()}`;

    await test.step("Create a questionnaire and open the builder", async () => {
      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title,
      });
    });

    await test.step("Add a choice question with two custom options", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
      // The type picker is the only combobox on screen for a freshly-added
      // question (AnswerOptionsEditor/SubQuestionsList aren't rendered yet).
      await page.getByRole("combobox").click();
      // The type option's accessible name also includes its description text,
      // so this can't be an exact match — "Choice" alone is still unambiguous.
      await page.getByRole("option", { name: "Choice" }).click();

      await page.getByRole("button", { name: "Add Option" }).click();
      await page.getByRole("button", { name: "Add Option" }).click();

      const rows = page.getByRole("row");
      const rowA = rows.nth(1);
      const rowB = rows.nth(2);

      await rowA.getByRole("textbox").fill(optionAValue);
      await rowB.getByRole("textbox").fill(optionBValue);

      // Mark the second option ("Severe") as the default/pre-selected answer.
      await rowB.getByRole("radio", { name: "Default" }).click();
    });

    await test.step("Save changes", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Preview shows both options as radio chips with the default pre-selected", async () => {
      await page.getByRole("button", { name: "Preview" }).click();

      const optionA = page.getByRole("radio", { name: optionAValue });
      const optionB = page.getByRole("radio", { name: optionBValue });
      await expect(optionA).toBeVisible();
      await expect(optionB).toBeVisible();
      await expect(optionB).toHaveAttribute("aria-checked", "true");
      await expect(optionA).toHaveAttribute("aria-checked", "false");

      await optionA.click();
      await expect(optionA).toHaveAttribute("aria-checked", "true");
      await expect(optionB).toHaveAttribute("aria-checked", "false");
    });

    await test.step("Detail overview shows the Choice type badge", async () => {
      await page.getByRole("button", { name: "Back" }).click();
      await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);

      await expect(page.getByText(questionTitle)).toBeVisible();
      await expect(page.getByText("Choice", { exact: true })).toBeVisible();
    });
  });

  test("more than five options switch the preview from chips to a dropdown", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const questionTitle = `Long list ${stamp}`;
    const optionValues = Array.from(
      { length: 6 },
      (_, index) => `opt-${index + 1}-${stamp}`,
    );

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 LongChoice ${stamp}`,
    });

    await test.step("Author a choice question with six options", async () => {
      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(questionTitle);
      await page.getByRole("combobox").click();
      await page.getByRole("option", { name: "Choice" }).click();

      for (const value of optionValues) {
        await page.getByRole("button", { name: "Add Option" }).click();
        const rows = page.getByRole("row");
        await rows.last().getByRole("textbox").fill(value);
      }
    });

    await test.step("Preview renders a searchable dropdown, not radio chips", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      // Ported legacy behavior: past five options the chips give way to a
      // dropdown (legacy ChoiceQuestion's selectType threshold).
      await expect(
        page.getByRole("radio", { name: optionValues[0] }),
      ).not.toBeVisible();
      const block = questionBlock(page, questionTitle);
      const trigger = block.getByRole("combobox");
      await expect(trigger).toBeVisible();
      await trigger.click();
      await page.getByRole("option", { name: optionValues[3] }).click();
      await expect(trigger).toContainText(optionValues[3]);
    });
  });
});
