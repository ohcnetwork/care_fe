import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import {
  STRUCTURED_FIXTURES,
  structuredFixtureUrl,
  type StructuredFixtureKey,
} from "tests/helper/structuredFixtures";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Pins the backend E2E fixture questionnaires (`bodhi/ENG-737-test-fixtures`
 * on `care`) behind `tests/helper/structuredFixtures.ts`: this is the proof
 * that the fixture's slug resolves, its section renders under its recorded
 * label, and — because it is a CORE type with a real `contract: 1`
 * definition registered — none of the slot's degradation notices show.
 * Every later structured-question spec (Tasks 10-12) assumes this once and
 * locates its block through `STRUCTURED_FIXTURES` instead of re-deriving
 * slugs/labels itself.
 *
 * Only the five simple-port types (`2026-08-04-phase2-ports-simple.md`)
 * loop here — NOT `unknown`, whose entire point is the OPPOSITE assertion
 * (its slot is EXPECTED to show the "requires a plugin that isn't enabled"
 * notice, since no plugin registers `x_e2e.missing`); a dedicated spec for
 * that negative case belongs to a later task, not this smoke pin.
 */
const SIMPLE_FIXTURE_KEYS: StructuredFixtureKey[] = [
  "time_of_death",
  "appointment",
  "charge_item",
  "encounter",
  "files",
];

/** Mirrors `structuredRendering.spec.ts`'s `DEGRADATION_NOTICES` — kept as
 *  a separate literal (not imported) so this spec's failure output names
 *  the regex inline rather than pointing at a sibling file, and because a
 *  fixture-map smoke test should not depend on another spec file's runtime
 *  export surface. */
const DEGRADATION_NOTICES = [
  /requires a plugin that isn't enabled/,
  /couldn't be displayed\. Reload the page/,
  /available when filling the form with/,
  /can't be used on a .* questionnaire/,
];

test.describe("Structured fixture questionnaires — slug/label/type agreement", () => {
  for (const key of SIMPLE_FIXTURE_KEYS) {
    const fixture = STRUCTURED_FIXTURES[key];

    test(`${key}: ${fixture.slug} resolves, renders "${fixture.label}", and shows no degradation notice`, async ({
      page,
    }) => {
      const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
      await page.goto(structuredFixtureUrl(questionnaireId));

      const block = questionBlock(page, fixture.label);
      await expect(block).toBeVisible();

      await test.step("no degradation notice — the real input mounted", async () => {
        // Auto-retrying, NOT a one-shot `innerText()` snapshot: the
        // structured slot mounts lazily, so a notice that renders a tick
        // after the block first appears would be invisible to a single
        // synchronous read taken right after `toBeVisible()` resolves —
        // exactly the failure mode that would let this assertion pass
        // vacuously while the type-registration half of the pin is broken.
        for (const notice of DEGRADATION_NOTICES) {
          await expect(block.getByText(notice)).toHaveCount(0);
        }
        // The widget put SOMETHING interactive on screen. Waiting on this
        // also settles the lazy/suspense mount before treating the checks
        // above as final. `:visible` matters: a hidden file input behind a
        // styled trigger (`files`) would otherwise satisfy a bare `input`
        // locator without the widget having actually finished mounting.
        await expect(
          block
            .locator(
              "button:visible, input:visible, textarea:visible, [role='combobox']:visible",
            )
            .first(),
        ).toBeVisible();
      });
    });
  }
});
