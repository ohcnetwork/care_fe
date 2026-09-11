import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { questionBlock } from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Rendering/layout smoke coverage for EVERY core structured question type
 * on the encounter fill mount, via the fixed pseudo-questionnaires
 * (`FIXED_QUESTIONNAIRES` in StructuredFormData). The per-type CRUD flows
 * live in the sibling specs (symptom/diagnosis/allergy/…); this spec pins
 * what those don't: that each type's widget actually MOUNTS an input on
 * the v2 fill page, renders exactly one question header (the renderer's —
 * the widgets' internal QuestionLabel duplicated it and sat misaligned
 * beside it), and doesn't break the canvas layout.
 */
const STRUCTURED_FIXED_FORMS: { slug: string; text: string }[] = [
  { slug: "symptom", text: "Symptom" },
  { slug: "diagnosis", text: "Diagnosis" },
  { slug: "allergy_intolerance", text: "Allergy Intolerance" },
  { slug: "medication_request", text: "Medication Request" },
  { slug: "medication_statement", text: "Medication Statement" },
  { slug: "service_request", text: "Service Request" },
  { slug: "encounter", text: "Encounter" },
  { slug: "files", text: "Files" },
  { slug: "time_of_death", text: "Time of Death" },
  { slug: "charge_item", text: "Charge Item" },
  { slug: "appointment", text: "Appointment" },
];

/** The slot's degradation notices — none of them may show for a core type
 *  on its own encounter mount. */
const DEGRADATION_NOTICES = [
  /requires a plugin that isn't enabled/,
  /couldn't be displayed\. Reload the page/,
  /available when filling the form with/,
  /can't be used on a .* questionnaire/,
];

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLElement>(
      'section[aria-label="Form canvas"]',
    );
    if (!canvas) return null;
    return canvas.scrollWidth - canvas.clientWidth;
  });
  expect(overflow, "form canvas must not scroll horizontally").not.toBeNull();
  // Sub-pixel rounding tolerance.
  expect(overflow!).toBeLessThanOrEqual(2);
}

test.describe("Structured question rendering on the fill page", () => {
  for (const { slug, text } of STRUCTURED_FIXED_FORMS) {
    test(`${slug}: widget mounts with one aligned header and no layout break`, async ({
      page,
    }) => {
      await page.goto(
        `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${slug}`,
      );

      const block = questionBlock(page, text);
      await expect(block).toBeVisible();

      await test.step("no degradation notice — the real input mounted", async () => {
        for (const notice of DEGRADATION_NOTICES) {
          await expect(block.getByText(notice)).toHaveCount(0);
        }
        // The widget put SOMETHING interactive on screen. Waiting on this
        // also settles the lazy/suspense mount before the checks below.
        // `:visible` matters: FileQuestion's first input is a deliberately
        // hidden file input behind a styled trigger.
        await expect(
          block
            .locator(
              "button:visible, input:visible, textarea:visible, [role='combobox']:visible",
            )
            .first(),
        ).toBeVisible();
      });

      await test.step("exactly one question header", async () => {
        // The renderer's label is the only one; the widgets' internal
        // QuestionLabel used to render a second, misaligned copy.
        await expect(
          block.locator("label").filter({ hasText: new RegExp(`^${text}$`) }),
        ).toHaveCount(1);
      });

      await test.step("layout holds", async () => {
        await expectNoHorizontalOverflow(page);
      });
    });
  }
});
