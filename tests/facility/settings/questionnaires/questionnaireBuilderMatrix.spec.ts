import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { createQuestionnaireAndOpenBuilder } from "tests/helper/questionnaireV2";
import { expectToast, selectFromValueSet } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const BEHAVIOUR_CARD_NAME = "Question Behaviour & Data Capture Settings";

/** Adds a top-level question via the sticky-bar button and titles it. */
async function addQuestion(page: Page, title: string): Promise<void> {
  const addFirst = page.getByRole("button", { name: "Add First Question" });
  if (await addFirst.isVisible().catch(() => false)) {
    await addFirst.click();
  } else {
    // Two "Add new question" buttons render once a question exists (tree
    // nav footer + sticky bar) — the sticky bar one is last.
    await page.getByRole("button", { name: "Add new question" }).last().click();
  }
  await page
    .getByRole("textbox", { name: "Question Title" })
    .pressSequentially(title);
}

/**
 * Picks a question type for the currently-selected question by its type
 * token (e.g. "date", "quantity"). The option's accessible name includes the
 * description sentence, which makes label matching ambiguous ("Date" is a
 * substring of "Date Time…"), so the cmdk item's data-value is the only
 * unambiguous hook.
 */
async function pickType(page: Page, type: string): Promise<void> {
  // The type picker is the first combobox in the editor card.
  await page.getByRole("combobox").first().click();
  await page
    .locator(`[data-slot="command-item"][data-value="${type}"]`)
    .click();
}

test.describe("Questionnaire v2 builder authoring matrix", () => {
  test("author date, quantity (with unit) and group types; preview renders each", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const dateTitle = `Onset date ${Date.now()}`;
    const quantityTitle = `Dose amount ${Date.now()}`;
    const groupTitle = `Vitals group ${Date.now()}`;
    const childTitle = `Blood pressure ${Date.now()}`;

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Types ${Date.now()}`,
    });

    await test.step("Author a date question", async () => {
      await addQuestion(page, dateTitle);
      await pickType(page, "date");
    });

    await test.step("Author a quantity question and bind a UCUM unit", async () => {
      await addQuestion(page, quantityTitle);
      await pickType(page, "quantity");
      // Quantity is valueset-only (legacy contract): no Custom Options mode,
      // the valueset is the unit-choice source.
      await expect(
        page.getByRole("radio", { name: "Custom Options" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add Option" }),
      ).not.toBeVisible();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select a value set" })
        .click();
      await page.locator('[data-slot="command-input"]').first().fill("UCUM");
      await page.getByRole("option", { name: "UCUM Units" }).click();
      const unitTrigger = page.getByRole("combobox", { name: "Default Unit" });
      await expect(unitTrigger).toBeVisible();
      await selectFromValueSet(page, unitTrigger, { search: "milligram" });
      await expect(unitTrigger).toContainText("milligram");
    });

    await test.step("Author a group with one sub-question", async () => {
      await addQuestion(page, groupTitle);
      await pickType(page, "group");
      await page.getByRole("button", { name: "Add Sub-Question" }).click();
      await page
        .getByRole("textbox", { name: "Question Title" })
        .pressSequentially(childTitle);
    });

    await test.step("Save", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
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
  });

  test("coding picker supports Remove and Change on a bound code", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Coding Actions ${Date.now()}`,
    });
    await addQuestion(page, faker.lorem.words(3));

    const searchTrigger = page.getByRole("combobox", {
      name: "Search for observation codes",
    });

    await test.step("Bind a code", async () => {
      await page
        .getByRole("button", { name: "Coding Details", exact: true })
        .click();
      await selectFromValueSet(page, searchTrigger, { search: "heart" });
      await expect(page.getByText("Code Verified")).toBeVisible();
    });

    await test.step("Remove unbinds and restores the search box", async () => {
      await page.getByRole("button", { name: "Remove" }).click();
      await expect(page.getByText("Code Verified")).not.toBeVisible();
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
  });

  test("answer options can be reordered, deleted and cleared of their default", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const suffix = faker.string.alphanumeric(4).toLowerCase();
    const optionA = `alpha-${suffix}`;
    const optionB = `beta-${suffix}`;
    const optionC = `gamma-${suffix}`;

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Options ${Date.now()}`,
    });
    await addQuestion(page, faker.lorem.words(3));
    await pickType(page, "choice");

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

    await test.step("Delete the first option via its kebab", async () => {
      await rows.nth(1).getByRole("button", { name: "More options" }).click();
      await page.getByRole("menuitem", { name: "Delete" }).click();
      await expect(rows.nth(1).getByRole("textbox")).toHaveValue(optionC);
      await expect(rows.nth(2).getByRole("textbox")).toHaveValue(optionB);
      await expect(rows.nth(3)).not.toBeVisible();
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
  });

  test("choice answers can come from a valueset instead of custom options", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Valueset Choice ${Date.now()}`,
    });
    await addQuestion(page, `Unit choice ${Date.now()}`);
    await pickType(page, "choice");

    await test.step("Switch the options editor to Value Set mode", async () => {
      await page.getByRole("radio", { name: "Value Set" }).click();
      await expect(
        page.getByText("Select a value set", { exact: true }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add Option" }),
      ).not.toBeVisible();
    });

    await test.step("Pick an existing valueset", async () => {
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select a value set" })
        .click();
      const search = page.locator('[data-slot="command-input"]').first();
      await search.fill("UCUM");
      await page.getByRole("option", { name: "UCUM Units" }).click();
      await expect(
        page.getByRole("combobox").filter({ hasText: "UCUM Units" }),
      ).toBeVisible();
    });

    await test.step("Save and preview renders a valueset search input", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.getByRole("button", { name: "Preview" }).click();
      // Choice-with-valueset renders the ValueSetSelect search trigger
      // (no accessible name — match on its placeholder text).
      await expect(
        page.getByRole("combobox").filter({ hasText: "Search..." }),
      ).toBeVisible();
    });
  });

  test("display question renders as plain text without an input", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const displayText = `Read this instruction ${stamp}`;

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Display ${stamp}`,
    });
    await addQuestion(page, displayText);
    await pickType(page, "display");

    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire updated successfully");

    await page.getByRole("button", { name: "Preview" }).click();
    // The text renders (label + display paragraph) with no input control
    // and no note affordance.
    await expect(page.getByText(displayText).first()).toBeVisible();
    await expect(page.getByRole("textbox")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add note" }),
    ).not.toBeVisible();
  });

  test("required flag renders an asterisk; repeats hides for boolean and clears on type change", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const questionTitle = `Mandatory field ${Date.now()}`;

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Flags ${Date.now()}`,
    });
    await addQuestion(page, questionTitle);

    const repeatable = page.getByRole("checkbox", { name: "Repeatable" });

    await test.step("Mark Required and Repeatable", async () => {
      await page.getByRole("button", { name: BEHAVIOUR_CARD_NAME }).click();
      await page.getByRole("checkbox", { name: "Required" }).click();
      await repeatable.click();
      await expect(repeatable).toHaveAttribute("aria-checked", "true");
      await expect(page.getByText("Configured • 2")).toBeVisible();
    });

    await test.step("Boolean never offers Repeats — and clears the flag", async () => {
      await pickType(page, "boolean");
      await expect(repeatable).not.toBeVisible();
      await expect(
        page.getByRole("checkbox", { name: "Required" }),
      ).toHaveAttribute("aria-checked", "true");

      await pickType(page, "string");
      await expect(repeatable).toBeVisible();
      await expect(repeatable).toHaveAttribute("aria-checked", "false");
      await expect(page.getByText("Configured • 1")).toBeVisible();
    });

    await test.step("Preview shows the required asterisk", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
      await page.getByRole("button", { name: "Preview" }).click();
      await expect(
        page.locator("label").filter({ hasText: questionTitle }),
      ).toBeVisible();
      await expect(page.locator("span.text-red-500")).toBeVisible();
    });
  });
});
