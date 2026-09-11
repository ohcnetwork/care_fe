import { expect, test, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { getFacilityId } from "tests/support/facilityId";

/**
 * SLUG_MIN_LENGTH/SLUG_MAX_LENGTH straight from the schema module's source
 * text, not a real `import`: the tests/ TypeScript project has no `@/*`
 * alias (see tests/tsconfig.json — it's scoped to `tests/*` only), and
 * questionnaireFormSchema.ts's own import chain reaches deep into the
 * app's domain types (down through `@/types/questionnaire/question` to
 * `@careConfig`, tag configs, icon CSS side-effects...). Wiring the tests
 * project to resolve all of that just to read two numbers would mean
 * duplicating a large slice of the root tsconfig inside an isolated
 * project meant to stay Node/Playwright-only. Reading the constants'
 * source text instead still pins this assertion to the ACTUAL bound —
 * it already drifted once (25 -> 50) — without smuggling the whole `src`
 * module graph into the Playwright type-check.
 */
function readSlugBound(name: "SLUG_MIN_LENGTH" | "SLUG_MAX_LENGTH"): number {
  const schemaPath = path.resolve(
    "src/components/QuestionnaireV2/manage/questionnaireFormSchema.ts",
  );
  const source = fs.readFileSync(schemaPath, "utf-8");
  const match = source.match(new RegExp(`export const ${name}\\s*=\\s*(\\d+)`));
  if (!match) {
    throw new Error(`Could not find "${name}" in ${schemaPath}`);
  }
  return Number(match[1]);
}

const SLUG_MIN_LENGTH = readSlugBound("SLUG_MIN_LENGTH");
const SLUG_MAX_LENGTH = readSlugBound("SLUG_MAX_LENGTH");

test.use({ storageState: "tests/.auth/user.json" });

/** Counts POST requests to the questionnaire create endpoint. */
function trackCreateRequests(page: Page) {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/api\/v1\/questionnaire\/$/.test(new URL(request.url()).pathname)
    ) {
      requests.push(request.url());
    }
  });
  return requests;
}

test.describe("Questionnaire v2 create form validation", () => {
  test("an empty title blocks the save with field errors", async ({ page }) => {
    const facilityId = getFacilityId();
    const posts = trackCreateRequests(page);

    await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);
    await page.getByRole("button", { name: "Save Questionnaire" }).click();

    await expect(page.getByText("This field is required")).toBeVisible();
    await expect(page).toHaveURL(/\/questionnaires\/new$/);
    expect(posts).toHaveLength(0);
  });

  test("slug bounds and format are enforced", async ({ page }) => {
    const facilityId = getFacilityId();
    const posts = trackCreateRequests(page);
    const title = `QV2 Slug Rules ${Date.now()}`;
    const slugInput = page.getByRole("textbox", { name: "Slug" });

    await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);

    await test.step("Typing a title auto-generates a slug", async () => {
      await page
        .getByRole("textbox", { name: "Title" })
        .pressSequentially(title);
      await expect(slugInput).not.toHaveValue("");
      const generated = await slugInput.inputValue();
      expect(generated.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
      expect(generated).toMatch(/^[-\w]+$/);
    });

    await test.step("A too-short slug fails the length rule", async () => {
      await slugInput.fill("ab");
      await page.getByRole("button", { name: "Save Questionnaire" }).click();
      await expect(
        page.getByText(
          `Must be atleast ${SLUG_MIN_LENGTH} characters and atmost ${SLUG_MAX_LENGTH} characters`,
        ),
      ).toBeVisible();
      expect(posts).toHaveLength(0);
    });

    await test.step("Invalid characters fail the format rule", async () => {
      await slugInput.fill("bad slug!");
      await page.getByRole("button", { name: "Save Questionnaire" }).click();
      // The hint text also shows the format sentence, so expect two matches
      // (description + error) once the rule fires.
      await expect(
        page.getByText(
          "Slug must only contain letters, numbers, underscores, and hyphens",
        ),
      ).toHaveCount(2);
      await expect(page).toHaveURL(/\/questionnaires\/new$/);
      expect(posts).toHaveLength(0);
    });
  });
});
