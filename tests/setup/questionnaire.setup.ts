import { test } from "@playwright/test";
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
