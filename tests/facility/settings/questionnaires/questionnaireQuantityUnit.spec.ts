import { expect, test, type Page } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaireAndOpenBuilder,
  pickValuesetFromAutocomplete,
} from "tests/helper/questionnaireV2";
import { expectToast, selectFromValueSet } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Backend round-trip pin for the quantity default unit. The renderer and
 * builder both depend on `question.unit` — the ONE unit field the backend
 * Question spec persists (`answer_unit` is silently dropped by pydantic).
 * This spec goes red if the backend ever stops persisting/returning it:
 * the post-save assertions run against a full page reload (fresh GET, no
 * client cache) plus a direct API read.
 */

/** Adds a top-level question via the sticky-bar button and titles it. */
async function addQuestion(page: Page, title: string): Promise<void> {
  const addFirst = page.getByRole("button", { name: "Add First Question" });
  if (await addFirst.isVisible().catch(() => false)) {
    await addFirst.click();
  } else {
    await page.getByRole("button", { name: "Add new question" }).last().click();
  }
  await page
    .getByRole("textbox", { name: "Question Title" })
    .pressSequentially(title);
}

/** Picks a question type by its cmdk data-value token (see builder matrix).
 *  Filters the list first — the unfiltered popover can overflow the
 *  viewport, leaving low entries (like quantity) unclickable. */
async function pickType(page: Page, type: string): Promise<void> {
  await page.getByRole("combobox").first().click();
  await page.locator('[data-slot="command-input"]').last().fill(type);
  await page
    .locator(`[data-slot="command-item"][data-value="${type}"]`)
    .click();
}

test.describe("Questionnaire v2 quantity default unit round-trip", () => {
  test("default unit persists through save + reload and seeds the preview picker", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const questionTitle = `Dose amount ${stamp}`;

    const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Quantity Unit ${stamp}`,
    });
    const questionnaireId =
      detailUrl.match(/questionnaires\/([0-9a-f-]+)/)?.[1] ?? "";
    expect(questionnaireId).not.toBe("");

    const builderUnitTrigger = page.getByRole("combobox", {
      name: "Default Unit",
    });
    let pickedDisplay = "";

    await test.step("Quantity is valueset-only: no Custom Options mode", async () => {
      await addQuestion(page, questionTitle);
      await pickType(page, "quantity");
      // Legacy contract: the old editor never offered custom options for
      // quantity — the v2 builder must not either.
      // Also matched by the canvas error chip ("…pick one under Unit
      // Options") until a valueset is chosen.
      await expect(page.getByText("Unit Options").first()).toBeVisible();
      await expect(
        page.getByRole("radio", { name: "Custom Options" }),
      ).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add Option" }),
      ).not.toBeVisible();
    });

    await test.step("Pick the unit value set and a default unit", async () => {
      // The backend rejects quantity questions without answer options or a
      // valueset; the builder authors the valueset (unit-choice source).
      await pickValuesetFromAutocomplete(page, {
        search: "UCUM",
        optionName: "UCUM Units",
      });

      await selectFromValueSet(page, builderUnitTrigger, {
        search: "milligram",
      });
      pickedDisplay =
        (await builderUnitTrigger.innerText()).split("\n")[0]?.trim() ?? "";
      expect(pickedDisplay.toLowerCase()).toContain("milligram");
    });

    await test.step("Save", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Full reload: the builder row shows the persisted unit", async () => {
      await page.reload();
      await page
        .getByRole("navigation")
        .getByRole("button", { name: questionTitle })
        .click();
      await expect(builderUnitTrigger).toContainText(pickedDisplay);
    });

    await test.step("API: unit round-trips verbatim; answer_unit is dropped", async () => {
      const res = await fetch(
        `${apiBaseUrl()}/api/v1/questionnaire/${questionnaireId}/`,
        { headers: adminApiHeaders() },
      );
      expect(res.ok).toBe(true);
      const data = (await res.json()) as {
        questions: {
          text: string;
          unit?: { system: string; code: string; display: string };
          answer_unit?: unknown;
          answer_value_set?: { slug?: string; external_id?: string };
          answer_option?: unknown[];
        }[];
      };
      const question = data.questions.find((q) => q.text === questionTitle);
      expect(question).toBeTruthy();
      expect(question?.unit?.system).toBe("http://unitsofmeasure.org");
      expect(question?.unit?.code).toBeTruthy();
      expect(question?.unit?.display).toBe(pickedDisplay);
      // The backend Question spec has no answer_unit field — it must never
      // reappear in reads (the FE default-unit logic reads `unit` only).
      expect(question?.answer_unit).toBeUndefined();
      // Valueset-only contract: the valueset persisted, no custom options.
      expect(
        question?.answer_value_set?.slug ??
          question?.answer_value_set?.external_id,
      ).toBeTruthy();
      expect(question?.answer_option ?? []).toHaveLength(0);
    });

    await test.step("Preview reads the reloaded state: unit picker defaults to it", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      await expect(page.getByRole("spinbutton")).toBeVisible();
      await expect(
        page.getByRole("combobox", { name: "Unit", exact: true }),
      ).toContainText(pickedDisplay);
    });
  });
});
