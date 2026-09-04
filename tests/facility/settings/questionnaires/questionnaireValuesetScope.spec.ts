import { expect, test, type Page } from "@playwright/test";
import {
  addTopLevelQuestion,
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaireAndOpenBuilder,
} from "tests/helper/questionnaireV2";
import {
  createFacilityOverride,
  deleteFacilityValueSetsBySlug,
  getInstanceValueSetIdBySlug,
} from "tests/helper/valueSet";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// A different parent than the fill-side preference spec uses, so the two
// can run in parallel without racing on the per-facility slug constraint.
const PARENT_SLUG = "system-route";
const PARENT_NAME = "Route";
const ORAL_ROUTE = {
  system: "http://snomed.info/sct",
  version: null,
  concept: [{ code: "26643006", display: "Oral route" }],
};

/** Picks a question type by its cmdk data-value token. */
async function pickType(page: Page, type: string): Promise<void> {
  await page.getByRole("combobox").first().click();
  await page
    .locator(`[data-slot="command-item"][data-value="${type}"]`)
    .click();
}

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
  test("labels both scopes and binds instance sets by slug, facility sets by id", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const overrideName = `Route facility ${stamp}`;
    const questionTitle = `Route given ${stamp}`;

    await deleteFacilityValueSetsBySlug(facilityId, PARENT_SLUG);
    const overrideId = await createFacilityOverride({
      facilityId,
      parentId: await getInstanceValueSetIdBySlug(PARENT_SLUG),
      parentSlug: PARENT_SLUG,
      name: overrideName,
      include: ORAL_ROUTE,
    });

    try {
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
        await pickType(page, "choice");
        await page.getByRole("radio", { name: "Value Set" }).click();
      });

      await test.step("Picker lists the facility override and the instance set, labelled", async () => {
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select a value set" })
          .click();
        const popover = page
          .locator("[data-radix-popper-content-wrapper]")
          .last();
        await popover
          .locator('[data-slot="command-input"]')
          .first()
          .fill("Route");
        await expect(
          popover.getByRole("option", {
            name: `${overrideName} (This facility)`,
          }),
        ).toBeVisible();
        await expect(
          popover.getByRole("option", { name: `${PARENT_NAME} (Instance)` }),
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
        expect(question.answer_value_set?.slug).toBe(PARENT_SLUG);
      });

      await test.step("An instance set is stored by slug alone", async () => {
        // The combobox now shows the current pick, not the placeholder the
        // shared helper keys on — re-pick through the labelled trigger.
        await page
          .getByRole("combobox")
          .filter({ hasText: `${overrideName} (This facility)` })
          .click();
        const popover = page
          .locator("[data-radix-popper-content-wrapper]")
          .last();
        await popover
          .locator('[data-slot="command-input"]')
          .first()
          .fill("Route");
        await popover
          .getByRole("option", { name: `${PARENT_NAME} (Instance)` })
          .click();
        await expect(
          page
            .getByRole("combobox")
            .filter({ hasText: `${PARENT_NAME} (Instance)` }),
        ).toBeVisible();
        await saveChanges();
        const question = await storedQuestion(questionnaireId, questionTitle);
        expect(question.answer_value_set?.slug).toBe(PARENT_SLUG);
        expect(question.answer_value_set?.external_id ?? null).toBeNull();
      });
    } finally {
      await deleteFacilityValueSetsBySlug(facilityId, PARENT_SLUG);
    }
  });
});
