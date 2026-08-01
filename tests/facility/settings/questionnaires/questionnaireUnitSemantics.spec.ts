import { expect, test, type Page } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  createQuestionnaireAndOpenBuilder,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast, selectFromValueSet } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Unit semantics across question types (legacy contract, verified against
 * the deleted develop editor):
 * - integer/decimal carry a question-level `unit` shown as a `(code)`
 *   suffix next to the label — no answer-time picker;
 * - quantity's `answer_value_set` is the unit-choice source: a bounded
 *   expansion renders every unit as an inline chip (owner UX directive),
 *   larger sets keep the search popover;
 * - a quantity without a valueset (and without grandfathered custom
 *   options) is blocked client-side — the backend would 400 it.
 *
 * Read-side tests drive the deterministic `e2e-units` backend fixture:
 * integer `/min`, decimal `Cel`, quantity bound to the 3-unit
 * `e2e-dose-units` valueset (mg/g/kg) with default mg.
 */

const UNITS_FIXTURE_SLUG = "e2e-units";

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

/** Picks a question type by its cmdk data-value token (see builder matrix). */
async function pickType(page: Page, type: string): Promise<void> {
  await page.getByRole("combobox").first().click();
  await page.locator('[data-slot="command-input"]').last().fill(type);
  await page
    .locator(`[data-slot="command-item"][data-value="${type}"]`)
    .click();
}

/** Opens the units fixture questionnaire straight into preview mode. */
async function openUnitsFixturePreview(page: Page): Promise<void> {
  const facilityId = getFacilityId();
  const id = await getQuestionnaireIdBySlug(UNITS_FIXTURE_SLUG);
  await page.goto(
    `/facility/${facilityId}/settings/questionnaires/${id}/edit?mode=preview`,
  );
  await expect(page.getByRole("navigation")).toBeVisible();
}

/** Jumps to a top-level question via the renderer's tree nav. */
async function jumpTo(page: Page, questionText: string): Promise<void> {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: questionText })
    .click();
}

test.describe("Questionnaire v2 unit semantics", () => {
  test("fixture preview: integer/decimal label units and bounded quantity unit chips", async ({
    page,
  }) => {
    await openUnitsFixturePreview(page);

    await test.step("Integer question shows its unit next to the label", async () => {
      await jumpTo(page, "Resting heart rate");
      const integerBlock = questionBlock(page, "Resting heart rate");
      await expect(
        integerBlock.locator("label").filter({ hasText: "Resting heart rate" }),
      ).toBeVisible();
      await expect(integerBlock.getByText("(/min)")).toBeVisible();
      await expect(integerBlock.getByRole("spinbutton")).toBeVisible();
    });

    await test.step("Decimal question shows its unit next to the label", async () => {
      await jumpTo(page, "Body temperature");
      const decimalBlock = questionBlock(page, "Body temperature");
      await expect(decimalBlock.getByText("(Cel)")).toBeVisible();
      await expect(decimalBlock.getByRole("spinbutton")).toBeVisible();
    });

    await test.step("Quantity renders every unit of the bounded valueset as chips", async () => {
      await jumpTo(page, "Dose given");
      // All three e2e-dose-units members are visible — nothing hidden
      // behind a search popover.
      for (const unit of ["milligram", "gram", "kilogram"]) {
        await expect(
          page.getByRole("radio", { name: unit, exact: true }),
        ).toBeVisible();
      }
      await expect(
        page.getByRole("combobox", { name: "Unit", exact: true }),
      ).not.toBeVisible();
    });

    await test.step("The author's default unit is pre-selected", async () => {
      await expect(
        page.getByRole("radio", { name: "milligram", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
    });

    await test.step("Picking a chip writes the unit; the value sticks", async () => {
      await questionBlock(page, "Dose given")
        .getByRole("spinbutton")
        .fill("250");
      await page.getByRole("radio", { name: "gram", exact: true }).click();
      await expect(
        page.getByRole("radio", { name: "gram", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByRole("radio", { name: "milligram", exact: true }),
      ).toHaveAttribute("aria-checked", "false");
      await expect(
        questionBlock(page, "Dose given").getByRole("spinbutton"),
      ).toHaveValue("250");
    });
  });

  test("integer and decimal units round-trip through save + reload", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();
    const integerTitle = `Heart rate ${stamp}`;
    const decimalTitle = `Temperature ${stamp}`;

    const detailUrl = await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Number Units ${stamp}`,
    });
    const questionnaireId =
      detailUrl.match(/questionnaires\/([0-9a-f-]+)/)?.[1] ?? "";
    expect(questionnaireId).not.toBe("");

    const unitTrigger = page.getByRole("combobox", { name: "Unit" });

    await test.step("Author an integer question with a unit", async () => {
      await addQuestion(page, integerTitle);
      await pickType(page, "integer");
      await expect(unitTrigger).toBeVisible();
      await selectFromValueSet(page, unitTrigger, { search: "milligram" });
      await expect(unitTrigger).toContainText("milligram");
    });

    await test.step("Author a decimal question with a unit", async () => {
      await addQuestion(page, decimalTitle);
      await pickType(page, "decimal");
      await selectFromValueSet(page, unitTrigger, { search: "kilogram" });
      await expect(unitTrigger).toContainText("kilogram");
    });

    await test.step("Save", async () => {
      await page.getByRole("button", { name: "Save Changes" }).click();
      await expectToast(page, "Questionnaire updated successfully");
    });

    await test.step("Full reload: the builder unit rows show persisted units", async () => {
      await page.reload();
      await page
        .getByRole("navigation")
        .getByRole("button", { name: integerTitle })
        .click();
      await expect(unitTrigger).toContainText("milligram");
      await page
        .getByRole("navigation")
        .getByRole("button", { name: decimalTitle })
        .click();
      await expect(unitTrigger).toContainText("kilogram");
    });

    await test.step("API: units persisted on both questions", async () => {
      const res = await fetch(
        `${apiBaseUrl()}/api/v1/questionnaire/${questionnaireId}/`,
        { headers: adminApiHeaders() },
      );
      expect(res.ok).toBe(true);
      const data = (await res.json()) as {
        questions: {
          text: string;
          type: string;
          unit?: { system: string; code: string };
        }[];
      };
      const integerQ = data.questions.find((q) => q.text === integerTitle);
      const decimalQ = data.questions.find((q) => q.text === decimalTitle);
      expect(integerQ?.unit?.code).toBe("mg");
      expect(integerQ?.unit?.system).toBe("http://unitsofmeasure.org");
      expect(decimalQ?.unit?.code).toBe("kg");
    });

    await test.step("Preview: number inputs show the unit as a label suffix", async () => {
      await page.getByRole("button", { name: "Preview" }).click();
      await page
        .getByRole("navigation")
        .getByRole("button", { name: integerTitle })
        .click();
      await expect(page.getByText("(mg)")).toBeVisible();
      await page
        .getByRole("navigation")
        .getByRole("button", { name: decimalTitle })
        .click();
      await expect(page.getByText("(kg)")).toBeVisible();
    });
  });

  test("a quantity question without a unit value set cannot be saved", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const stamp = Date.now();

    await createQuestionnaireAndOpenBuilder(page, {
      basePath: `/facility/${facilityId}/settings/questionnaires`,
      title: `QV2 Quantity Guard ${stamp}`,
    });
    await addQuestion(page, `Dose amount ${stamp}`);
    await pickType(page, "quantity");

    await page.getByRole("button", { name: "Save Changes" }).click();
    // Blocked client-side (the backend would reject it with a 400).
    await expectToast(
      page,
      "Quantity questions need a unit value set — pick one under Unit Options",
    );
  });
});
