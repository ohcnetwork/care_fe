import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import {
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/** Form A: the route-mounted (primary) questionnaire. */
const PRIMARY_SLUG = "respiratory_status-v3";
/** Form B: added in-session — plain questions only, so the assertion is
 *  about the session plumbing and not about a structured adapter. */
const ADDED_SLUG = "patient_feedback";
const ADDED_TITLE = /Feedback Form/;

/** Answers form A's two required questions (see fillValidation.spec.ts). */
async function answerPrimaryRequired(page: Page) {
  await questionBlock(page, "Is bilateral air entry present?")
    .getByRole("radio", { name: "yes", exact: true })
    .click();
  await questionBlock(page, "Select Modality")
    .getByRole("radio", { name: "oxygen_support", exact: true })
    .click();
}

/** Opens the add-questionnaire picker and appends `title` to the session.
 *  The fill page gives QuestionnaireSearch a plain-button trigger, so the
 *  affordance has a real accessible name (the default combobox trigger
 *  takes no name from its contents). */
async function addQuestionnaire(page: Page, title: RegExp) {
  await page.getByRole("button", { name: "Add questionnaire" }).click();
  await page.getByPlaceholder("Search Forms").fill("Feedback");
  await page.getByRole("option", { name: title }).click();
}

test.describe("Fill page multi-questionnaire sessions", () => {
  let fillUrl: string;
  let primaryId: string;
  let addedId: string;

  test.beforeEach(async ({ page }) => {
    primaryId = await getQuestionnaireIdBySlug(PRIMARY_SLUG);
    addedId = await getQuestionnaireIdBySlug(ADDED_SLUG);
    fillUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${primaryId}`;
    await page.goto(fillUrl);
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
  });

  test("adds a second questionnaire and submits both in one batch", async ({
    page,
  }) => {
    const noteA = `A-${faker.string.alphanumeric(10)}`;
    const noteB = `B-${faker.string.alphanumeric(10)}`;

    await answerPrimaryRequired(page);
    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(noteA);

    // Only the primary form exists so far.
    await expect(page.locator("[data-form-key]")).toHaveCount(1);

    await addQuestionnaire(page, ADDED_TITLE);

    // Form B joins the SAME scroll, below form A — one page, two forms.
    const forms = page.locator("[data-form-key]");
    await expect(forms).toHaveCount(2);
    await expect(forms.nth(0)).toHaveAttribute("data-form-key", primaryId);
    await expect(forms.nth(1)).toHaveAttribute("data-form-key", addedId);
    await expect(
      forms.nth(1).getByRole("heading", { name: ADDED_TITLE }),
    ).toBeVisible();

    // Answering form B writes into ITS OWN store — form A keeps its answer.
    await questionBlock(page, "Any Suggestions for Improvement")
      .getByRole("textbox")
      .fill(noteB);
    await expect(
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
    ).toHaveValue(noteA);

    // One Save Changes submits both forms in a single batch.
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);

    await expect(page.getByText(noteA)).toBeVisible();
    await expect(page.getByText(noteB)).toBeVisible();
  });

  test("the local draft covers the whole session and Resume brings the added form back", async ({
    page,
  }) => {
    const noteA = `A-${faker.string.alphanumeric(10)}`;
    const noteB = `B-${faker.string.alphanumeric(10)}`;

    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(noteA);
    await addQuestionnaire(page, ADDED_TITLE);
    await questionBlock(page, "Any Suggestions for Improvement")
      .getByRole("textbox")
      .fill(noteB);

    // Reload: the pagehide flush persists ONE draft covering both forms.
    await page.reload();
    await expect(
      questionBlock(page, "Is bilateral air entry present?"),
    ).toBeVisible();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await expect(
      page.getByText("Includes 1 added questionnaire."),
    ).toBeVisible();
    // Nothing is seeded before the clinician says so — the added form is
    // not on the page yet either.
    await expect(page.locator("[data-form-key]")).toHaveCount(1);

    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.locator("[data-form-key]")).toHaveCount(2);
    await expect(
      questionBlock(page, "Note on Bilateral Air Entry").getByRole("textbox"),
    ).toHaveValue(noteA);
    await expect(
      questionBlock(page, "Any Suggestions for Improvement").getByRole(
        "textbox",
      ),
    ).toHaveValue(noteB);
  });

  test("remove affordance drops a non-primary form", async ({ page }) => {
    const noteA = `A-${faker.string.alphanumeric(10)}`;
    const noteB = `B-${faker.string.alphanumeric(10)}`;

    await answerPrimaryRequired(page);
    await questionBlock(page, "Note on Bilateral Air Entry")
      .getByRole("textbox")
      .fill(noteA);

    await addQuestionnaire(page, ADDED_TITLE);
    const addedForm = page.locator(`[data-form-key="${addedId}"]`);
    await expect(addedForm).toHaveCount(1);
    await questionBlock(page, "Any Suggestions for Improvement")
      .getByRole("textbox")
      .fill(noteB);

    // Remove drops the added form (and its answers) from the session; the
    // primary form has no remove affordance.
    await addedForm.getByRole("button", { name: "Remove" }).click();
    await expect(addedForm).toHaveCount(0);
    await expect(page.locator("[data-form-key]")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0);

    await page.getByRole("button", { name: "Save Changes" }).click();
    await expectToast(page, "Questionnaire submitted successfully");
    await page.waitForURL(/\/updates$/);

    // Only form A reached the server.
    await expect(page.getByText(noteA)).toBeVisible();
    await expect(page.getByText(noteB)).toHaveCount(0);
  });
});
