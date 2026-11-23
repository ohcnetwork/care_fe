import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  addQuestionViaUi,
  addTopLevelQuestion,
  createQuestionnaireAndOpenBuilder,
  pickQuestionType,
  pickValuesetFromAutocomplete,
  saveQuestionnaireBuilderViaUi,
} from "tests/helper/questionnaireV2";
import { expectToast, selectFromValueSet } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Questionnaire v2 builder authoring matrix", () => {
  test(
    "author date, quantity (with unit) and group types; preview renders each",
    { tag: ["@atomic", "@cap:questionnaire.author.question.add"] },
    async ({ page }) => {
      const facilityId = getFacilityId();
      const dateTitle = `Onset date ${Date.now()}`;
      const quantityTitle = `Dose amount ${Date.now()}`;
      const groupTitle = `Vitals group ${Date.now()}`;
      const childTitle = `Blood pressure ${Date.now()}`;

      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Types ${Date.now()}`,
      });

      await addQuestionViaUi(page, { title: dateTitle, type: "date" });

      await test.step("Author a quantity question and bind a UCUM unit", async () => {
        await addTopLevelQuestion(page, quantityTitle);
        await pickQuestionType(page, { type: "quantity" });
        // Quantity is valueset-only (legacy contract): no Custom Options mode,
        // the valueset is the unit-choice source.
        await expect(
          page.getByRole("radio", { name: "Custom Options" }),
        ).toBeHidden();
        await expect(
          page.getByRole("button", { name: "Add Option" }),
        ).toBeHidden();
        await pickValuesetFromAutocomplete(page, {
          search: "UCUM",
          optionName: "UCUM Units",
        });
        const unitTrigger = page.getByRole("combobox", {
          name: "Default Unit",
        });
        await expect(unitTrigger).toBeVisible();
        await selectFromValueSet(page, unitTrigger, { search: "milligram" });
        await expect(unitTrigger).toContainText("milligram");
      });

      await test.step("Author a group with one sub-question", async () => {
        await addTopLevelQuestion(page, groupTitle);
        await pickQuestionType(page, { type: "group" });
        await page.getByRole("button", { name: "Add Sub-Question" }).click();
        await page
          .getByRole("textbox", { name: "Question Title" })
          .pressSequentially(childTitle);
      });

      await test.step("Save", async () => {
        await saveQuestionnaireBuilderViaUi(page);
      });

      await test.step("Preview: date picker on page 1", async () => {
        await page.getByRole("button", { name: "Preview" }).click();
        await expect(
          page.getByRole("button", { name: "Pick a date" }),
        ).toBeVisible();
      });

      await test.step("Preview: quantity value input with the authored default unit", async () => {
        await page
          .getByRole("navigation")
          .getByRole("button", { name: quantityTitle })
          .click();
        await expect(page.getByRole("spinbutton")).toBeVisible();
        await expect(
          page.getByRole("combobox", { name: "Unit", exact: true }),
        ).toContainText("milligram");
      });

      await test.step("Preview: group card with its child", async () => {
        await page
          .getByRole("navigation")
          .getByRole("button", { name: groupTitle })
          .click();
        await expect(
          page.getByRole("heading", { name: groupTitle }),
        ).toBeVisible();
        await expect(page.getByText("Group", { exact: true })).toBeVisible();
        await expect(
          page.locator("label").filter({ hasText: childTitle }),
        ).toBeVisible();
      });
    },
  );

  test(
    "coding picker supports Remove and Change on a bound code",
    { tag: ["@atomic", "@cap:questionnaire.author.coding.link"] },
    async ({ page }) => {
      const facilityId = getFacilityId();

      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Coding Actions ${Date.now()}`,
      });
      await addTopLevelQuestion(page, faker.lorem.words(3));

      const searchTrigger = page.getByRole("combobox", {
        name: "Search for observation codes",
      });

      await test.step("Bind a code", async () => {
        await page.getByRole("tab", { name: "Coding" }).click();
        await selectFromValueSet(page, searchTrigger, { search: "heart" });
        await expect(page.getByText("Code Verified")).toBeVisible();
      });

      await test.step("Remove unbinds and restores the search box", async () => {
        await page.getByRole("button", { name: "Remove" }).click();
        await expect(page.getByText("Code Verified")).toBeHidden();
        await expect(searchTrigger).toBeVisible();
      });

      await test.step("Re-bind, then Change swaps to a different code", async () => {
        await selectFromValueSet(page, searchTrigger, { search: "heart" });
        await expect(page.getByText("Code Verified")).toBeVisible();
        const before = await page.getByText(/LOINC: \S+/).textContent();

        const changeTrigger = page.getByRole("combobox", { name: "Change" });
        await selectFromValueSet(page, changeTrigger, { search: "glucose" });
        await expect(page.getByText("Code Verified")).toBeVisible();
        await expect(page.getByText(/LOINC: \S+/)).not.toHaveText(before ?? "");
      });
    },
  );

  test(
    "answer options can be reordered, deleted and cleared of their default",
    { tag: ["@atomic", "@cap:questionnaire.author.answeroption.configure"] },
    async ({ page }) => {
      const facilityId = getFacilityId();
      const suffix = faker.string.alphanumeric(4).toLowerCase();
      const optionA = `alpha-${suffix}`;
      const optionB = `beta-${suffix}`;
      const optionC = `gamma-${suffix}`;

      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Options ${Date.now()}`,
      });
      await addTopLevelQuestion(page, faker.lorem.words(3));
      await pickQuestionType(page, { type: "choice" });

      const rows = page.getByRole("row");

      await test.step("Add three options and default the middle one", async () => {
        for (const value of [optionA, optionB, optionC]) {
          await page.getByRole("button", { name: "Add Option" }).click();
          await rows.last().getByRole("textbox").fill(value);
        }
        await rows.nth(2).getByRole("radio", { name: "Default" }).click();
        await expect(
          rows.nth(2).getByRole("radio", { name: "Default" }),
        ).toHaveAttribute("aria-checked", "true");
      });

      await test.step("Move the last option up", async () => {
        await rows.nth(3).getByRole("button", { name: "Move Up" }).click();
        await expect(rows.nth(2).getByRole("textbox")).toHaveValue(optionC);
        await expect(rows.nth(3).getByRole("textbox")).toHaveValue(optionB);
      });

      await test.step("Delete the first option directly", async () => {
        await rows.nth(1).getByRole("button", { name: "Delete" }).click();
        await expect(rows.nth(1).getByRole("textbox")).toHaveValue(optionC);
        await expect(rows.nth(2).getByRole("textbox")).toHaveValue(optionB);
        await expect(rows.nth(3)).toBeHidden();
      });

      await test.step("Clear default resets every option", async () => {
        await page.getByRole("button", { name: "Clear default" }).click();
        for (const index of [1, 2]) {
          await expect(
            rows.nth(index).getByRole("radio", { name: "Default" }),
          ).toHaveAttribute("aria-checked", "false");
        }
        await expect(
          page.getByRole("button", { name: "Clear default" }),
        ).toBeDisabled();
      });
    },
  );

  test(
    "choice answers can come from a valueset instead of custom options",
    { tag: ["@atomic", "@cap:questionnaire.author.answeroption.configure"] },
    async ({ page }) => {
      const facilityId = getFacilityId();

      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Valueset Choice ${Date.now()}`,
      });
      await addTopLevelQuestion(page, `Unit choice ${Date.now()}`);
      await pickQuestionType(page, { type: "choice" });

      await test.step("Switch the options editor to Value Set mode", async () => {
        await page.getByRole("radio", { name: "Value Set" }).click();
        await expect(
          page.getByText("Select a value set", { exact: true }).first(),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Add Option" }),
        ).toBeHidden();
      });

      await test.step("Pick an existing valueset", async () => {
        // Scoped through the shared helper — a page-level
        // [data-slot="command-input"].first() can race the type picker's
        // closing popover portal (the documented flake).
        await pickValuesetFromAutocomplete(page, {
          search: "UCUM",
          optionName: "UCUM Units",
        });
      });

      await test.step("Save and preview renders a valueset search input", async () => {
        await saveQuestionnaireBuilderViaUi(page);
        await page.getByRole("button", { name: "Preview" }).click();
        // Choice-with-valueset renders the ValueSetSelect search trigger
        // (no accessible name — match on its placeholder text).
        await expect(
          page.getByRole("combobox").filter({ hasText: "Search..." }),
        ).toBeVisible();
      });
    },
  );

  test(
    "display question renders as plain text without an input",
    { tag: ["@atomic", "@cap:questionnaire.author.question.add"] },
    async ({ page }) => {
      const facilityId = getFacilityId();
      const stamp = Date.now();
      const displayText = `Read this instruction ${stamp}`;

      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Display ${stamp}`,
      });
      await addTopLevelQuestion(page, displayText);
      await pickQuestionType(page, { type: "display" });

      await saveQuestionnaireBuilderViaUi(page);

      await page.getByRole("button", { name: "Preview" }).click();
      // Display-only content has no control label. Anchor its visible text
      // before asserting that no input or note control is rendered.
      const block = page
        .getByRole("region", { name: "Form canvas" })
        .locator("[data-question-id]")
        .filter({ has: page.getByText(displayText, { exact: true }) });
      await expect(block).toHaveCount(1);
      await expect(block.getByText(displayText, { exact: true })).toBeVisible();
      await expect(block.getByRole("textbox")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Add note" })).toBeHidden();
    },
  );

  test(
    "required flag renders an asterisk; repeats hides for boolean and clears on type change",
    { tag: ["@atomic", "@cap:questionnaire.author.question.edit"] },
    async ({ page }) => {
      const facilityId = getFacilityId();
      const questionTitle = `Mandatory field ${Date.now()}`;

      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Flags ${Date.now()}`,
      });
      await addTopLevelQuestion(page, questionTitle);

      const repeatable = page.getByRole("checkbox", { name: "Repeatable" });

      await test.step("Mark Required and Repeatable", async () => {
        // Behaviour chips render inline on the inspector's Question tab.
        await page.getByRole("checkbox", { name: "Required" }).click();
        await repeatable.click();
        await expect(repeatable).toHaveAttribute("aria-checked", "true");
        await expect(
          page.getByRole("checkbox", { name: "Required" }),
        ).toHaveAttribute("aria-checked", "true");
      });

      await test.step("Boolean never offers Repeats — and clears the flag", async () => {
        await pickQuestionType(page, { type: "boolean" });
        await expect(repeatable).toBeHidden();
        await expect(
          page.getByRole("checkbox", { name: "Required" }),
        ).toHaveAttribute("aria-checked", "true");

        await pickQuestionType(page, { type: "string" });
        await expect(repeatable).toBeVisible();
        await expect(repeatable).toHaveAttribute("aria-checked", "false");
      });

      await test.step("Preview shows the required asterisk", async () => {
        await saveQuestionnaireBuilderViaUi(page);
        await page.getByRole("button", { name: "Preview" }).click();
        await expect(
          page.locator("label").filter({ hasText: questionTitle }),
        ).toBeVisible();
        await expect(page.locator("span.text-red-500")).toBeVisible();
      });
    },
  );

  test(
    "switching a structured question to string clears its type-specific fields from the save payload",
    { tag: ["@atomic", "@cap:questionnaire.author.question.edit"] },
    async ({ page }) => {
      const facilityId = getFacilityId();
      const stamp = Date.now();
      const questionTitle = `Symptom entry ${stamp}`;
      const typeTrigger = page.getByRole("combobox", { name: "Question Type" });

      await createQuestionnaireAndOpenBuilder(page, {
        basePath: `/facility/${facilityId}/settings/questionnaires`,
        title: `QV2 Type Residue ${stamp}`,
      });
      await addTopLevelQuestion(page, questionTitle);

      await test.step("Author it as a structured Symptoms question", async () => {
        await pickQuestionType(page, { type: "structured" });
        // Picking a bare "Structured" tile only opens its sub-list (see
        // QuestionTypePicker.handleSelectType) — the actual type patch fires
        // from the structured sub-type tile, still inside the same popover.
        await page
          .locator('[data-slot="command-item"][data-value="symptom"]')
          .click();
        await expect(typeTrigger).toContainText("Symptoms");
      });

      await test.step("Switch the type to String", async () => {
        await pickQuestionType(page, { type: "string" });
        await expect(typeTrigger).toContainText("String");
      });

      await test.step("Save; the PUT payload carries no structured-type residue", async () => {
        // A stale `structured_type` on a non-structured question would route
        // fill-time answers into the structured compose path, which then
        // never submits (P2-4) — assert on the actual outgoing payload
        // rather than the UI, which wouldn't catch a field the picker no
        // longer shows an editor for.
        const putRequest = page.waitForRequest(
          (request) =>
            request.url().includes("/api/v1/questionnaire/") &&
            request.method() === "PUT",
        );
        await page.getByRole("button", { name: "Save Changes" }).click();

        const body = JSON.parse((await putRequest).postData() ?? "{}") as {
          questions: {
            text: string;
            type: string;
            structured_type?: unknown;
            answer_option?: unknown;
            answer_value_set?: unknown;
            unit?: unknown;
          }[];
        };
        const question = body.questions.find((q) => q.text === questionTitle);
        expect(question?.type).toBe("string");
        expect(question?.structured_type).toBeUndefined();
        expect(question?.answer_option).toBeUndefined();
        expect(question?.answer_value_set).toBeUndefined();
        expect(question?.unit).toBeUndefined();

        await expectToast(page, "Questionnaire updated successfully");
      });
    },
  );
});
