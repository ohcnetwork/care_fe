import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  checkVisibility,
  expectFieldError,
  fillStringField,
  submitAndExpectSuccess,
  submitForm,
  verifySubmittedValues,
} from "tests/helper/questionnaire";
import { questionBlock } from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";
import { getQuestionnaireId } from "tests/support/questionnaireId";

// Every test in this file submits responses to the same shared encounter and
// the second asserts a hidden dependent is ABSENT from the response
// overview — running them in parallel lets another test's submission leak
// into that overview. Opt out of fullyParallel to keep the file sequential.
test.describe.configure({ mode: "default" });

test.describe("Enable When — 'exists' operator (answer: false)", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();
    // The fill route fetches by external_id (slug lookup is not supported).
    const questionnaireId = await getQuestionnaireId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${questionnaireId}`,
    );
    await expect(questionBlock(page, "Insurance Provider")).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // Source: Insurance Provider → Dependent: Self-Pay Reason [required]
  // operator: exists, answer: false — the dependent shows precisely when
  // the source has NO value, the inverse of every other 'exists' fixture
  // in this suite (which all use answer: true).
  // ──────────────────────────────────────────────

  test("T1: source unanswered → dependent visible [required] + empty → validation error", async ({
    page,
  }) => {
    await test.step("Dependent is visible when source is unanswered", async () => {
      await checkVisibility(page, "Self-Pay Reason", true);
    });

    await test.step("Submit without filling the required dependent", async () => {
      await submitForm(page);
      await expectFieldError(page, "Self-Pay Reason");
    });
  });

  test("T2: source answered → dependent hides → submits without it", async ({
    page,
  }) => {
    const provider = faker.company.name();

    await test.step("Fill source — dependent hides", async () => {
      await fillStringField(page, "Insurance Provider", provider);
      await checkVisibility(page, "Self-Pay Reason", false);
    });

    await test.step("Form submits successfully without the hidden dependent", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify submitted values on overview and hidden dependent absent", async () => {
      await verifySubmittedValues(page, [provider], ["Self-Pay Reason"]);
    });
  });
});
