import { test } from "@playwright/test";
import { ensureQuestionnaireE2EFixtures } from "tests/support/questionnaireE2EFixtures";
import { ensureEnableWhenQuestionnaire } from "tests/support/questionnaireId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Seeds the legacy enable-when fill-flow fixture questionnaire.
 *
 * The seeding itself lives in `tests/support/questionnaireId.ts` so the
 * specs can fall back to it in-process — see
 * `ensureEnableWhenQuestionnaire`'s own doc comment.
 */
test("ensure enable-when questionnaire exists", async () => {
  await ensureEnableWhenQuestionnaire();
});

/**
 * Seeds the slug-addressed questionnaire fixtures (`e2e-*`,
 * `respiratory_status-v3`, `patient_feedback`) — see
 * `tests/support/questionnaireE2EFixtures.ts`.
 */
test("ensure questionnaire E2E fixtures exist", async () => {
  await ensureQuestionnaireE2EFixtures();
});
