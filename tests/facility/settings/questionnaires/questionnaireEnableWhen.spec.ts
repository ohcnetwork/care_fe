import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 enable_when visibility", () => {
  test("dependent question stays hidden until the boolean trigger is answered Yes", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const title = `QV2 EnableWhen ${Date.now()}`;
    const triggerTitle = `${faker.word.words(2)} Trigger ${Date.now()}`;
    const dependentTitle = `${faker.word.words(2)} Dependent ${Date.now()}`;

    await test.step("Create a questionnaire", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await page.getByRole("button", { name: "Save Form" }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);
    });

    await test.step("Add a boolean trigger question and a string dependent question", async () => {
      await page.getByRole("button", { name: "Edit Questions" }).click();
      await page.waitForURL(/\/edit$/);

      await page.getByRole("button", { name: "Add First Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(triggerTitle);
      // The type picker is the only combobox on screen for a freshly-added
      // question (AnswerOptionsEditor/SubQuestionsList aren't rendered yet).
      await page.getByRole("combobox").click();
      // The type option's accessible name also includes its description text,
      // so this can't be an exact match — "Boolean" alone is still unambiguous.
      await page.getByRole("option", { name: "Boolean" }).click();

      // Two "Add new question" buttons render once a question exists — one
      // in the tree nav footer, one in the sticky bottom bar — both dispatch
      // the same action, so pick the last (sticky bar) to disambiguate.
      await page
        .getByRole("button", { name: "Add new question" })
        .last()
        .click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(dependentTitle);
    });

    await test.step("Add a visibility condition: trigger equals Yes", async () => {
      await page
        .getByRole("button", { name: "Question Visibility Conditions" })
        .click();
      await page.getByRole("button", { name: "Add a condition" }).click();

      const conditionRow = page.locator('div[class*="sm:grid-cols-2"]');
      const conditionFields = conditionRow.getByRole("combobox");

      await conditionFields.nth(0).click();
      await page.getByRole("option", { name: triggerTitle }).click();

      await conditionFields.nth(1).click();
      await page.getByRole("option", { name: "Equals", exact: true }).click();

      await conditionFields.nth(2).click();
      await page.getByRole("option", { name: "Yes", exact: true }).click();
    });

    await test.step("Save changes", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Preview: dependent question is hidden until the trigger is Yes", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      // The title also appears in the tree nav (visible once >1 top-level
      // question exists) alongside the field's own label — .first() just
      // needs either to confirm the trigger question is on screen.
      await expect(page.getByText(triggerTitle).first()).toBeVisible();

      const nextButton = page.getByRole("button", { name: "Next" });
      await expect(nextButton).toBeDisabled();
      await expect(page.getByText(dependentTitle)).not.toBeVisible();
    });

    await test.step("Answering No keeps the dependent question hidden", async () => {
      await page.getByRole("radio", { name: "No", exact: true }).click();
      await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
      await expect(page.getByText(dependentTitle)).not.toBeVisible();
    });

    await test.step("Answering Yes reveals the dependent question", async () => {
      await page.getByRole("radio", { name: "Yes", exact: true }).click();
      const nextButton = page.getByRole("button", { name: "Next" });
      await expect(nextButton).toBeEnabled();
      await nextButton.click();
      await expect(page.getByText(dependentTitle).first()).toBeVisible();
    });
  });
});
