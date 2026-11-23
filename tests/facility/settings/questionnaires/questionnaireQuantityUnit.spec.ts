import { expect, test } from "@playwright/test";
import {
  addTopLevelQuestion,
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaireAndOpenBuilder,
  pickQuestionType,
  pickValuesetFromAutocomplete,
  saveQuestionnaireBuilderViaUi,
} from "tests/helper/questionnaireV2";
import { selectFromValueSet } from "tests/helper/ui";
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

test.describe("Questionnaire v2 quantity default unit round-trip", () => {
  test(
    "default unit persists through save + reload and seeds the preview picker",
    { tag: ["@atomic", "@cap:questionnaire.author.unit.configure"] },
    async ({ page }) => {
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
        await addTopLevelQuestion(page, questionTitle);
        await pickQuestionType(page, { type: "quantity", filter: true });
        // Legacy contract: the old editor never offered custom options for
        // quantity — the v2 builder must not either.
        // Also matched by the canvas error chip ("…pick one under Unit
        // Options") until a valueset is chosen.
        await expect(page.getByText("Unit Options").first()).toBeVisible();
        await expect(
          page.getByRole("radio", { name: "Custom Options" }),
        ).toBeHidden();
        await expect(
          page.getByRole("button", { name: "Add Option" }),
        ).toBeHidden();
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
        await saveQuestionnaireBuilderViaUi(page);
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
    },
  );
});
