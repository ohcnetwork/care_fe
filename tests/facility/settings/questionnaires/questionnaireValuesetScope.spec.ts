import { expect, test } from "@playwright/test";
import {
  addTopLevelQuestion,
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaireAndOpenBuilder,
  pickQuestionType,
} from "tests/helper/questionnaireV2";
import {
  createFacilityOverride,
  createInstanceValueSet,
  deleteFacilityValueSetsBySlug,
  deleteValueSet,
} from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// A facility override wins for every picker bound to its slug in the
// facility, so this spec overrides an instance set of its own, never the
// shared `system-route` other specs (e.g. medicationRequest) resolve through.
const ORAL_ROUTE = {
  system: "http://snomed.info/sct",
  version: null,
  concept: [{ code: "26643006", display: "Oral route" }],
};

interface StoredQuestion {
  text: string;
  answer_value_set?: { slug?: string | null; external_id?: string | null };
}

async function storedQuestion(
  questionnaireId: string,
  text: string,
): Promise<StoredQuestion> {
  const res = await fetch(
    `${apiBaseUrl()}/api/v1/questionnaire/${questionnaireId}/`,
    { headers: adminApiHeaders() },
  );
  const body = (await res.json()) as { questions: StoredQuestion[] };
  const question = body.questions.find((q) => q.text === text);
  if (!question) {
    throw new Error(`question "${text}" not found on ${questionnaireId}`);
  }
  return question;
}

/**
 * The studio's value-set picker inside a facility lists the facility's own
 * sets next to the instance ones, and stores them differently: an instance
 * set by slug alone (so the facility's override and each user's preference
 * apply at fill time), a facility set pinned by id.
 */
test.describe("Studio value-set picker (facility scope)", () => {
  test(
    "labels both scopes and binds instance sets by slug, facility sets by id",
    { tag: ["@atomic", "@cap:questionnaire.author.answeroption.configure"] },
    async ({ page }) => {
      const facilityId = getFacilityId();
      const stamp = Date.now();
      const parentSlug = `e2e-scope-route-${stamp}`;
      const parentName = `E2E Scope Route ${stamp}`;
      const overrideName = `Route facility ${stamp}`;
      const questionTitle = `Route given ${stamp}`;
      // Both value sets carry the stamp in their names, so searching for it
      // lists exactly the instance set and its facility override.
      const search = String(stamp);

      const parentId = await createInstanceValueSet({
        slug: parentSlug,
        name: parentName,
        include: ORAL_ROUTE,
      });

      try {
        const overrideId = await createFacilityOverride({
          facilityId,
          parentId,
          parentSlug,
          name: overrideName,
          include: ORAL_ROUTE,
        });
        let questionnaireId = "";

        await test.step("Author a value-set choice question", async () => {
          const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
            basePath: `/facility/${facilityId}/settings/questionnaires`,
            title: `QV2 VS Scope ${stamp}`,
          });
          questionnaireId =
            detailUrl.match(/questionnaires\/([0-9a-f-]+)/)?.[1] ?? "";
          expect(questionnaireId).not.toBe("");

          await addTopLevelQuestion(page, questionTitle);
          await pickQuestionType(page, { type: "choice" });
          await page.getByRole("radio", { name: "Value Set" }).click();
        });

        await test.step("Picker lists the facility override and the instance set, labelled", async () => {
          await page
            .getByRole("combobox")
            .filter({ hasText: "Select a value set" })
            .click();
          const popover = page.locator('[data-slot="combobox-content"]').last();
          await popover
            .getByRole("combobox", { name: "Search option...", exact: true })
            .fill(search);
          await expect(
            popover.getByRole("option", {
              name: `${overrideName} (This facility)`,
            }),
          ).toBeVisible();
          await expect(
            popover.getByRole("option", { name: `${parentName} (Instance)` }),
          ).toBeVisible();
          await popover
            .getByRole("option", { name: `${overrideName} (This facility)` })
            .click();
        });

        // Two saves happen seconds apart, so the first success toast can still
        // be on screen when the second Save is clicked — wait on the PUT itself.
        const saveChanges = async () => {
          const saved = page.waitForResponse(
            (res) =>
              res.request().method() === "PUT" &&
              res.url().includes(`/questionnaire/${questionnaireId}/`),
          );
          await page.getByRole("button", { name: "Save Changes" }).click();
          expect((await saved).ok()).toBe(true);
        };

        await test.step("A facility set is stored pinned by id", async () => {
          await saveChanges();
          const question = await storedQuestion(questionnaireId, questionTitle);
          expect(question.answer_value_set?.external_id).toBe(overrideId);
          expect(question.answer_value_set?.slug).toBe(parentSlug);
        });

        await test.step("An instance set is stored by slug alone", async () => {
          // The combobox now shows the current pick, not the placeholder the
          // shared helper keys on — re-pick through the labelled trigger.
          await page
            .getByRole("combobox")
            .filter({ hasText: `${overrideName} (This facility)` })
            .click();
          const popover = page.locator('[data-slot="combobox-content"]').last();
          await popover
            .getByRole("combobox", { name: "Search option...", exact: true })
            .fill(search);
          await popover
            .getByRole("option", { name: `${parentName} (Instance)` })
            .click();
          await expect(
            page
              .getByRole("combobox")
              .filter({ hasText: `${parentName} (Instance)` }),
          ).toBeVisible();
          await saveChanges();
          const question = await storedQuestion(questionnaireId, questionTitle);
          expect(question.answer_value_set?.slug).toBe(parentSlug);
          expect(question.answer_value_set?.external_id ?? null).toBeNull();
        });

        await test.step("Clearing a resolved set removes the binding and its displayed selection", async () => {
          const selectedTrigger = page
            .getByRole("combobox")
            .filter({ hasText: `${parentName} (Instance)` });
          await selectedTrigger
            .locator("xpath=..")
            .getByRole("button", { name: "Clear", exact: true })
            .click();
          await expect(
            page
              .getByRole("combobox")
              .filter({ hasText: "Select a value set" }),
          ).toBeVisible();
          await expect(selectedTrigger).toHaveCount(0);
        });
      } finally {
        await deleteFacilityValueSetsBySlug(facilityId, parentSlug);
        await deleteValueSet(parentId);
      }
    },
  );
});
