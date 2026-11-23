import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createQuestionnaireAndOpenBuilder,
  importQuestionsViaUi,
  jumpToQuestion,
  KITCHEN_SINK_FACILITY_SLUG,
  openQuestionnairePreview,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Live enable_when evaluation in the renderer, driven by the deterministic
 * e2e-kitchen-sink-facility fixture (numeric, string, OR-behavior and
 * protected conditions authored server-side). Hidden questions drop out of
 * the tree nav, which is what these tests observe. Preview only — the
 * fixture is never mutated.
 */

const openKitchenSinkPreview = (page: Page) =>
  openQuestionnairePreview(page, {
    facilityId: getFacilityId(),
    slug: KITCHEN_SINK_FACILITY_SLUG,
  });

function navRow(page: Page, questionText: string): Locator {
  return page
    .getByRole("navigation")
    .getByRole("button", { name: questionText });
}

test.describe("Questionnaire v2 enable_when matrix (kitchen sink fixture)", () => {
  test(
    "numeric greater/less conditions toggle their dependents live",
    { tag: ["@atomic", "@cap:questionnaire.author.preview.enablewhen"] },
    async ({ page }) => {
      await openKitchenSinkPreview(page);

      await test.step("Both numeric dependents start hidden", async () => {
        await expect(navRow(page, "Severe pain follow-up")).toBeHidden();
        await expect(navRow(page, "Low pain follow-up")).toBeHidden();
      });

      await test.step("Pain score 8 reveals only the greater-than dependent", async () => {
        await jumpToQuestion(page, "Pain score (0-10)");
        await questionBlock(page, "Pain score (0-10)")
          .getByRole("spinbutton")
          .fill("8");
        await expect(navRow(page, "Severe pain follow-up")).toBeVisible();
        await expect(navRow(page, "Low pain follow-up")).toBeHidden();
      });

      await test.step("Pain score 2 swaps to the less-than dependent", async () => {
        await questionBlock(page, "Pain score (0-10)")
          .getByRole("spinbutton")
          .fill("2");
        await expect(navRow(page, "Low pain follow-up")).toBeVisible();
        await expect(navRow(page, "Severe pain follow-up")).toBeHidden();
      });

      await test.step("Clearing the score hides both again", async () => {
        await questionBlock(page, "Pain score (0-10)")
          .getByRole("spinbutton")
          .fill("");
        await expect(navRow(page, "Severe pain follow-up")).toBeHidden();
        await expect(navRow(page, "Low pain follow-up")).toBeHidden();
      });
    },
  );

  test(
    "string equals condition follows the typed answer",
    { tag: ["@atomic", "@cap:questionnaire.author.preview.enablewhen"] },
    async ({ page }) => {
      await openKitchenSinkPreview(page);

      await expect(navRow(page, "Fever details")).toBeHidden();

      await test.step("Typing the matching answer reveals the dependent", async () => {
        await questionBlock(page, "Primary symptom")
          .getByPlaceholder("Enter details")
          .fill("fever");
        await expect(navRow(page, "Fever details")).toBeVisible();
      });

      await test.step("A non-matching answer hides it again", async () => {
        await questionBlock(page, "Primary symptom")
          .getByPlaceholder("Enter details")
          .fill("cough");
        await expect(navRow(page, "Fever details")).toBeHidden();
      });
    },
  );

  test(
    "any-behavior (OR) dependent shows when either condition matches",
    { tag: ["@atomic", "@cap:questionnaire.author.preview.enablewhen"] },
    async ({ page }) => {
      await openKitchenSinkPreview(page);

      // Conditions: boolean == Yes OR pain score > 5, enable_behavior "any".
      await expect(navRow(page, "Any-behavior follow-up")).toBeHidden();

      await test.step("Only the numeric condition matching is enough", async () => {
        await jumpToQuestion(page, "Pain score (0-10)");
        await questionBlock(page, "Pain score (0-10)")
          .getByRole("spinbutton")
          .fill("6");
        await expect(navRow(page, "Any-behavior follow-up")).toBeVisible();
      });

      await test.step("Clearing it hides the dependent again", async () => {
        await questionBlock(page, "Pain score (0-10)")
          .getByRole("spinbutton")
          .fill("");
        await expect(navRow(page, "Any-behavior follow-up")).toBeHidden();
      });

      await test.step("Only the boolean condition matching is also enough", async () => {
        await jumpToQuestion(page, "Is the patient stable?");
        await page.getByRole("radio", { name: "Yes", exact: true }).click();
        await expect(navRow(page, "Any-behavior follow-up")).toBeVisible();
      });
    },
  );

  test(
    "boolean Yes/No conditions swap their dependents",
    { tag: ["@atomic", "@cap:questionnaire.author.preview.enablewhen"] },
    async ({ page }) => {
      await openKitchenSinkPreview(page);

      await expect(navRow(page, "Stability notes")).toBeHidden();
      await expect(navRow(page, "Escalation plan")).toBeHidden();

      await test.step("Yes reveals the Yes-dependent only", async () => {
        await jumpToQuestion(page, "Is the patient stable?");
        await page.getByRole("radio", { name: "Yes", exact: true }).click();
        await expect(navRow(page, "Stability notes")).toBeVisible();
        await expect(navRow(page, "Escalation plan")).toBeHidden();
      });

      await test.step("No swaps to the No-dependent", async () => {
        await page.getByRole("radio", { name: "No", exact: true }).click();
        await expect(navRow(page, "Escalation plan")).toBeVisible();
        await expect(navRow(page, "Stability notes")).toBeHidden();
      });
    },
  );

  test(
    "protected disabled_display renders locked instead of hidden",
    { tag: ["@atomic", "@cap:questionnaire.author.preview.enablewhen"] },
    async ({ page }) => {
      await openKitchenSinkPreview(page);

      await test.step("The protected question stays in the nav while disabled", async () => {
        await expect(navRow(page, "Protected note")).toBeVisible();
        await jumpToQuestion(page, "Protected note");
        await expect(
          questionBlock(
            page,
            "Protected note (visible but locked when disabled)",
          ).getByPlaceholder("Enter details"),
        ).toBeDisabled();
      });

      await test.step("Meeting the condition unlocks the input", async () => {
        await jumpToQuestion(page, "Is the patient stable?");
        await page.getByRole("radio", { name: "Yes", exact: true }).click();
        await jumpToQuestion(page, "Protected note");
        await expect(
          questionBlock(
            page,
            "Protected note (visible but locked when disabled)",
          ).getByPlaceholder("Enter details"),
        ).toBeEnabled();
      });
    },
  );

  test(
    "empty states: zero questions and every question hidden",
    { tag: ["@atomic", "@cap:questionnaire.author.preview"] },
    async ({ page }) => {
      const facilityId = getFacilityId();

      await test.step("A fresh questionnaire previews the zero-question state", async () => {
        await createQuestionnaireAndOpenBuilder(page, {
          basePath: `/facility/${facilityId}/settings/questionnaires`,
          title: `QV2 Empty Preview ${Date.now()}`,
        });
        await page.getByRole("button", { name: "Preview" }).click();
        await expect(page.getByText("No questions added yet!")).toBeVisible();
      });

      await test.step("Import two mutually-dependent questions (all hidden)", async () => {
        await page.getByRole("button", { name: "Edit", exact: true }).click();
        // Import remaps link_ids and drops conditions on unknown targets, so
        // an unreachable state needs a cycle: each question's condition points
        // at the other; both unanswered → both evaluate false → both hidden.
        await importQuestionsViaUi(page, {
          fileName: "all-hidden.json",
          questions: [
            {
              text: "Forever hidden",
              type: "string",
              link_id: "hidden-a",
              enable_when: [
                { question: "hidden-b", operator: "equals", answer: "x" },
              ],
            },
            {
              text: "Also forever hidden",
              type: "string",
              link_id: "hidden-b",
              enable_when: [
                { question: "hidden-a", operator: "equals", answer: "x" },
              ],
            },
          ],
        });
        await expect(
          page.getByRole("textbox", { name: "Question Title" }),
        ).toHaveValue("Forever hidden");
      });

      await test.step("Preview explains that every question is hidden", async () => {
        await page.getByRole("button", { name: "Preview" }).click();
        await expect(page.getByRole("alert")).toContainText(
          "This form has circular visibility conditions.",
        );
        await expect(
          page.getByText(
            "No questions to show — every question in this form is hidden by its visibility conditions.",
          ),
        ).toBeVisible();
      });
    },
  );
});
