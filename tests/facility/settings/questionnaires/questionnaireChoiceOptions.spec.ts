import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
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

    await test.step("Create a questionnaire", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await page.getByRole("button", { name: "Save Form" }).click();
      await expectToast(page, "Questionnaire created successfully");
      await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);
    });

    await test.step("Add a choice question with two custom options", async () => {
      await page.getByRole("button", { name: "Edit Questions" }).click();
      await page.waitForURL(/\/edit$/);

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

      // Display Text is intentionally left blank here — see the "known bug"
      // test below for that field, which the backend currently drops.
      await rowA.getByRole("textbox").nth(0).fill(optionAValue);
      await rowB.getByRole("textbox").nth(0).fill(optionBValue);

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

  test("known bug: custom option Display Text is dropped on save, so preview falls back to the raw value", async ({
    page,
  }) => {
    // BLOCKED-ON-BUG: the ENG-737 backend's AnswerOption model
    // (care/emr/resources/questionnaire/spec.py — class AnswerOption, around
    // line 114) only declares `value` and `initial_selected`. It has no
    // `display` (or `code`) field, so pydantic silently drops the option's
    // Display Text on every save — confirmed by filling it in the builder,
    // saving, and inspecting the field afterwards: it comes back undefined.
    // ChoiceInput.tsx then renders `option.display ?? option.value`, i.e. the
    // raw value, as the chip label. This is a pre-existing backend gap (the
    // AnswerOption class has never had a display field), not a regression on
    // this frontend branch — see finding [28]'s own note about a related
    // parked defect ("ChoiceInput answer_option writes lack coding").
    //
    // This test pins the INTENDED behavior so it starts failing (in the good
    // sense — an "unexpected pass" that flags the fix) the moment the backend
    // adds the field, instead of silently asserting the broken value forever.
    test.fail(
      true,
      "Backend AnswerOption spec has no `display` field (care/emr/resources/questionnaire/spec.py) — " +
        "custom option Display Text is dropped on save. Remove this test.fail() once the backend persists it.",
    );

    const facilityId = getFacilityId();
    const title = `QV2 Choice Display ${Date.now()}`;
    const questionTitle = `${faker.word.words(2)} Severity ${Date.now()}`;
    const optionValue = `opt-${faker.string.alphanumeric(4).toLowerCase()}`;
    const optionDisplay = `Mild ${faker.string.alphanumeric(4)}`;

    await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);
    await page.getByRole("textbox", { name: "Title" }).pressSequentially(title);
    await page.getByRole("button", { name: "Save Form" }).click();
    await expectToast(page, "Questionnaire created successfully");
    await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);

    await page.getByRole("button", { name: "Edit Questions" }).click();
    await page.waitForURL(/\/edit$/);
    await page.getByRole("button", { name: "Add First Question" }).click();
    await page
      .getByRole("textbox", { name: "Question Title" })
      .pressSequentially(questionTitle);
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Choice" }).click();

    await page.getByRole("button", { name: "Add Option" }).click();
    const row = page.getByRole("row").nth(1);
    await row.getByRole("textbox").nth(0).fill(optionValue);
    await row.getByRole("textbox").nth(1).fill(optionDisplay);

    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire updated successfully");

    await page.getByRole("button", { name: "Preview" }).click();
    await expect(
      page.getByRole("radio", { name: optionDisplay }),
    ).toBeVisible();
  });
});
