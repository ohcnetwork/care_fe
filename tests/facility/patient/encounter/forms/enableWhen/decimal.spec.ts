import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import {
  checkVisibility,
  clearDecimalField,
  expectFieldError,
  fillDecimalField,
  fillStringField,
  submitAndExpectSuccess,
  submitForm,
  verifySubmittedValues,
} from "tests/helper/questionnaire";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

const QUESTIONNAIRE_SLUG = "enable-when-test";

// Values that trigger/don't trigger each operator relative to threshold (10)
const TRIGGER_EXISTS = "5"; // any value triggers exists
const TRIGGER_EQUALS = "10"; // exactly 10
const NON_TRIGGER_EQUALS = "15.5"; // not 10
const TRIGGER_NOT_EQUALS = "15.5"; // anything except 10
const NON_TRIGGER_NOT_EQUALS = "10"; // exactly 10 — does NOT trigger not_equals
const TRIGGER_GREATER = "15.5"; // > 10
const NON_TRIGGER_GREATER = "5"; // ≤ 10
const TRIGGER_LESS = "5.5"; // < 10
const NON_TRIGGER_LESS = "15"; // ≥ 10
const TRIGGER_GTE = "10"; // ≥ 10 (boundary)
const NON_TRIGGER_GTE = "5"; // < 10
const TRIGGER_LTE = "10"; // ≤ 10 (boundary)
const NON_TRIGGER_LTE = "15"; // > 10

// Safe values for filling other decimal source fields so required dependents don't block submit.
// Each safe value must NOT trigger the respective operator for that source.
const SAFE = {
  exists: undefined as string | undefined, // leave empty — no value means exists=false
  equals: NON_TRIGGER_EQUALS, // 15.5 — won't equal 10
  notEquals: NON_TRIGGER_NOT_EQUALS, // 10 — equals 10 so not_equals is false
  greater: NON_TRIGGER_GREATER, // 5 — not > 10
  less: NON_TRIGGER_LESS, // 15 — not < 10
  gte: NON_TRIGGER_GTE, // 5 — not ≥ 10
  lte: NON_TRIGGER_LTE, // 15 — not ≤ 10
};

/**
 * Fills all other decimal source fields with safe (non-triggering) values
 * so their required dependents stay hidden and don't block form submission.
 * Skips the source being actively tested (identified by `excludeLabel`).
 */
async function fillOtherDecimalSources(page: Page, excludeLabel: string) {
  const sources: { label: string; value: string | undefined }[] = [
    { label: "Patient Score", value: SAFE.exists },
    { label: "Exact Match Score", value: SAFE.equals },
    { label: "Non-Standard Score", value: SAFE.notEquals },
    { label: "High Score", value: SAFE.greater },
    { label: "Low Score", value: SAFE.less },
    { label: "Threshold Score GTE", value: SAFE.gte },
    { label: "Threshold Score LTE", value: SAFE.lte },
  ];

  for (const { label, value } of sources) {
    if (label === excludeLabel) continue;
    if (value !== undefined) {
      await fillDecimalField(page, label, value);
    }
    // If value is undefined, leave field empty (safe for exists operator)
  }
}

test.describe("Enable When — Decimal Operators", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${QUESTIONNAIRE_SLUG}`,
    );
    await expect(
      page.getByText("Patient Score", { exact: true }),
    ).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // DECIMAL 'exists' operator
  // Source: Patient Score → Dependents: Score Interpretation [required], Score Comments [optional]
  // ──────────────────────────────────────────────

  test.describe("'exists' operator", () => {
    test("T1: source unanswered → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Dependent hidden when source is empty", async () => {
        await checkVisibility(page, "Score Interpretation", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Patient Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Score Interpretation"]);
      });
    });

    test("T2: source unanswered → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Dependent hidden when source is empty", async () => {
        await checkVisibility(page, "Score Comments", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Patient Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Score Comments"]);
      });
    });

    test("T3: source answered → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source — dependent appears", async () => {
        await fillDecimalField(page, "Patient Score", TRIGGER_EXISTS);
        await checkVisibility(page, "Score Interpretation", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Score Interpretation");
      });
    });

    test("T4: source answered → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const interpretation = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillDecimalField(page, "Patient Score", TRIGGER_EXISTS);
        await checkVisibility(page, "Score Interpretation", true);
        await fillStringField(page, "Score Interpretation", interpretation);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Patient Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [interpretation]);
      });
    });

    test("T5: source answered → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const interpretation = faker.lorem.words(3);

      await test.step("Fill source — optional dependent appears", async () => {
        await fillDecimalField(page, "Patient Score", TRIGGER_EXISTS);
        await checkVisibility(page, "Score Comments", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Score Interpretation", interpretation);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Patient Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [interpretation], ["Score Comments"]);
      });
    });

    test("T6: source answered then cleared → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const interpretation = faker.lorem.words(3);
      const comments = faker.lorem.sentence();

      await test.step("Fill source — dependents appear", async () => {
        await fillDecimalField(page, "Patient Score", TRIGGER_EXISTS);
        await checkVisibility(page, "Score Interpretation", true);
        await checkVisibility(page, "Score Comments", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Score Interpretation", interpretation);
        await fillStringField(page, "Score Comments", comments);
      });

      await test.step("Clear source — dependents hide", async () => {
        await clearDecimalField(page, "Patient Score");
        await checkVisibility(page, "Score Interpretation", false);
        await checkVisibility(page, "Score Comments", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Patient Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [interpretation, comments]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // DECIMAL 'equals' operator
  // Source: Exact Match Score → Dependents: Match Diagnosis [required], Match Notes [optional]
  // Match value: "10" (string comparison after normalization)
  // ──────────────────────────────────────────────

  test.describe("'equals' operator", () => {
    test("T1: source ≠ threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-matching value — dependent hidden", async () => {
        await fillDecimalField(page, "Exact Match Score", NON_TRIGGER_EQUALS);
        await checkVisibility(page, "Match Diagnosis", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Exact Match Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Match Diagnosis"]);
      });
    });

    test("T2: source ≠ threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-matching value — dependent hidden", async () => {
        await fillDecimalField(page, "Exact Match Score", NON_TRIGGER_EQUALS);
        await checkVisibility(page, "Match Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Exact Match Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Match Notes"]);
      });
    });

    test("T3: source = threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with matching value — dependent appears", async () => {
        await fillDecimalField(page, "Exact Match Score", TRIGGER_EQUALS);
        await checkVisibility(page, "Match Diagnosis", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Match Diagnosis");
      });
    });

    test("T4: source = threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const diagnosis = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillDecimalField(page, "Exact Match Score", TRIGGER_EQUALS);
        await checkVisibility(page, "Match Diagnosis", true);
        await fillStringField(page, "Match Diagnosis", diagnosis);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Exact Match Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [diagnosis]);
      });
    });

    test("T5: source = threshold → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const diagnosis = faker.lorem.words(3);

      await test.step("Fill source — optional dependent appears", async () => {
        await fillDecimalField(page, "Exact Match Score", TRIGGER_EQUALS);
        await checkVisibility(page, "Match Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Match Diagnosis", diagnosis);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Exact Match Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [diagnosis], ["Match Notes"]);
      });
    });

    test("T6: source = threshold → changed to non-match → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const diagnosis = faker.lorem.words(3);
      const notes = faker.lorem.sentence();

      await test.step("Fill source with matching value — dependents appear", async () => {
        await fillDecimalField(page, "Exact Match Score", TRIGGER_EQUALS);
        await checkVisibility(page, "Match Diagnosis", true);
        await checkVisibility(page, "Match Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Match Diagnosis", diagnosis);
        await fillStringField(page, "Match Notes", notes);
      });

      await test.step("Change source to non-matching value — dependents hide", async () => {
        await clearDecimalField(page, "Exact Match Score");
        await fillDecimalField(page, "Exact Match Score", NON_TRIGGER_EQUALS);
        await checkVisibility(page, "Match Diagnosis", false);
        await checkVisibility(page, "Match Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Exact Match Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [diagnosis, notes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // DECIMAL 'not_equals' operator
  // Source: Non-Standard Score → Dependents: Deviation Reason [required], Deviation Notes [optional]
  // Match value: "10" (dependents show when source ≠ 10)
  // ──────────────────────────────────────────────

  test.describe("'not_equals' operator", () => {
    test("T1: source = threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with matching value — dependent stays hidden", async () => {
        await fillDecimalField(
          page,
          "Non-Standard Score",
          NON_TRIGGER_NOT_EQUALS,
        );
        await checkVisibility(page, "Deviation Reason", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Non-Standard Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Deviation Reason"]);
      });
    });

    test("T2: source = threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with matching value — dependent stays hidden", async () => {
        await fillDecimalField(
          page,
          "Non-Standard Score",
          NON_TRIGGER_NOT_EQUALS,
        );
        await checkVisibility(page, "Deviation Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Non-Standard Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Deviation Notes"]);
      });
    });

    test("T3: source ≠ threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with non-matching value — dependent appears", async () => {
        await fillDecimalField(page, "Non-Standard Score", TRIGGER_NOT_EQUALS);
        await checkVisibility(page, "Deviation Reason", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Deviation Reason");
      });
    });

    test("T4: source ≠ threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const reason = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillDecimalField(page, "Non-Standard Score", TRIGGER_NOT_EQUALS);
        await checkVisibility(page, "Deviation Reason", true);
        await fillStringField(page, "Deviation Reason", reason);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Non-Standard Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [reason]);
      });
    });

    test("T5: source ≠ threshold → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const reason = faker.lorem.words(3);

      await test.step("Fill source — optional dependent appears", async () => {
        await fillDecimalField(page, "Non-Standard Score", TRIGGER_NOT_EQUALS);
        await checkVisibility(page, "Deviation Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Deviation Reason", reason);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Non-Standard Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [reason], ["Deviation Notes"]);
      });
    });

    test("T6: source ≠ threshold → changed to match → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const reason = faker.lorem.words(3);
      const devNotes = faker.lorem.sentence();

      await test.step("Fill source with non-matching value — dependents appear", async () => {
        await fillDecimalField(page, "Non-Standard Score", TRIGGER_NOT_EQUALS);
        await checkVisibility(page, "Deviation Reason", true);
        await checkVisibility(page, "Deviation Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Deviation Reason", reason);
        await fillStringField(page, "Deviation Notes", devNotes);
      });

      await test.step("Change source to matching value — dependents hide", async () => {
        await clearDecimalField(page, "Non-Standard Score");
        await fillDecimalField(
          page,
          "Non-Standard Score",
          NON_TRIGGER_NOT_EQUALS,
        );
        await checkVisibility(page, "Deviation Reason", false);
        await checkVisibility(page, "Deviation Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Non-Standard Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [reason, devNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // DECIMAL 'greater' operator
  // Source: High Score → Dependents: High Alert Action [required], High Alert Notes [optional]
  // Threshold: 10 (dependents show when source > 10)
  // ──────────────────────────────────────────────

  test.describe("'greater' operator", () => {
    test("T1: source ≤ threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillDecimalField(page, "High Score", NON_TRIGGER_GREATER);
        await checkVisibility(page, "High Alert Action", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "High Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["High Alert Action"]);
      });
    });

    test("T2: source ≤ threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillDecimalField(page, "High Score", NON_TRIGGER_GREATER);
        await checkVisibility(page, "High Alert Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "High Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["High Alert Notes"]);
      });
    });

    test("T3: source > threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with triggering value — dependent appears", async () => {
        await fillDecimalField(page, "High Score", TRIGGER_GREATER);
        await checkVisibility(page, "High Alert Action", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "High Alert Action");
      });
    });

    test("T4: source > threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillDecimalField(page, "High Score", TRIGGER_GREATER);
        await checkVisibility(page, "High Alert Action", true);
        await fillStringField(page, "High Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "High Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [action]);
      });
    });

    test("T5: source > threshold → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source — optional dependent appears", async () => {
        await fillDecimalField(page, "High Score", TRIGGER_GREATER);
        await checkVisibility(page, "High Alert Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "High Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "High Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [action], ["High Alert Notes"]);
      });
    });

    test("T6: source > threshold → changed to ≤ threshold → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);
      const alertNotes = faker.lorem.sentence();

      await test.step("Fill source with triggering value — dependents appear", async () => {
        await fillDecimalField(page, "High Score", TRIGGER_GREATER);
        await checkVisibility(page, "High Alert Action", true);
        await checkVisibility(page, "High Alert Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "High Alert Action", action);
        await fillStringField(page, "High Alert Notes", alertNotes);
      });

      await test.step("Change source to non-triggering value — dependents hide", async () => {
        await clearDecimalField(page, "High Score");
        await fillDecimalField(page, "High Score", NON_TRIGGER_GREATER);
        await checkVisibility(page, "High Alert Action", false);
        await checkVisibility(page, "High Alert Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "High Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [action, alertNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // DECIMAL 'less' operator
  // Source: Low Score → Dependents: Low Alert Action [required], Low Alert Notes [optional]
  // Threshold: 10 (dependents show when source < 10)
  // ──────────────────────────────────────────────

  test.describe("'less' operator", () => {
    test("T1: source ≥ threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillDecimalField(page, "Low Score", NON_TRIGGER_LESS);
        await checkVisibility(page, "Low Alert Action", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Low Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Low Alert Action"]);
      });
    });

    test("T2: source ≥ threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillDecimalField(page, "Low Score", NON_TRIGGER_LESS);
        await checkVisibility(page, "Low Alert Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Low Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Low Alert Notes"]);
      });
    });

    test("T3: source < threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with triggering value — dependent appears", async () => {
        await fillDecimalField(page, "Low Score", TRIGGER_LESS);
        await checkVisibility(page, "Low Alert Action", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Low Alert Action");
      });
    });

    test("T4: source < threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillDecimalField(page, "Low Score", TRIGGER_LESS);
        await checkVisibility(page, "Low Alert Action", true);
        await fillStringField(page, "Low Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Low Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [action]);
      });
    });

    test("T5: source < threshold → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source — optional dependent appears", async () => {
        await fillDecimalField(page, "Low Score", TRIGGER_LESS);
        await checkVisibility(page, "Low Alert Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Low Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Low Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [action], ["Low Alert Notes"]);
      });
    });

    test("T6: source < threshold → changed to ≥ threshold → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);
      const alertNotes = faker.lorem.sentence();

      await test.step("Fill source with triggering value — dependents appear", async () => {
        await fillDecimalField(page, "Low Score", TRIGGER_LESS);
        await checkVisibility(page, "Low Alert Action", true);
        await checkVisibility(page, "Low Alert Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Low Alert Action", action);
        await fillStringField(page, "Low Alert Notes", alertNotes);
      });

      await test.step("Change source to non-triggering value — dependents hide", async () => {
        await clearDecimalField(page, "Low Score");
        await fillDecimalField(page, "Low Score", NON_TRIGGER_LESS);
        await checkVisibility(page, "Low Alert Action", false);
        await checkVisibility(page, "Low Alert Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Low Score");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [action, alertNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // DECIMAL 'greater_or_equals' operator
  // Source: Threshold Score GTE → Dependents: GTE Alert Action [required], GTE Alert Notes [optional]
  // Threshold: 10 (dependents show when source ≥ 10)
  // ──────────────────────────────────────────────

  test.describe("'greater_or_equals' operator", () => {
    test("T1: source < threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillDecimalField(page, "Threshold Score GTE", NON_TRIGGER_GTE);
        await checkVisibility(page, "GTE Alert Action", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["GTE Alert Action"]);
      });
    });

    test("T2: source < threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillDecimalField(page, "Threshold Score GTE", NON_TRIGGER_GTE);
        await checkVisibility(page, "GTE Alert Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["GTE Alert Notes"]);
      });
    });

    test("T3: source ≥ threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with triggering value — dependent appears", async () => {
        await fillDecimalField(page, "Threshold Score GTE", TRIGGER_GTE);
        await checkVisibility(page, "GTE Alert Action", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "GTE Alert Action");
      });
    });

    test("T4: source ≥ threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillDecimalField(page, "Threshold Score GTE", TRIGGER_GTE);
        await checkVisibility(page, "GTE Alert Action", true);
        await fillStringField(page, "GTE Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [action]);
      });
    });

    test("T5: source ≥ threshold → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source — optional dependent appears", async () => {
        await fillDecimalField(page, "Threshold Score GTE", TRIGGER_GTE);
        await checkVisibility(page, "GTE Alert Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "GTE Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [action], ["GTE Alert Notes"]);
      });
    });

    test("T6: source ≥ threshold → changed to < threshold → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);
      const alertNotes = faker.lorem.sentence();

      await test.step("Fill source with triggering value — dependents appear", async () => {
        await fillDecimalField(page, "Threshold Score GTE", TRIGGER_GTE);
        await checkVisibility(page, "GTE Alert Action", true);
        await checkVisibility(page, "GTE Alert Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "GTE Alert Action", action);
        await fillStringField(page, "GTE Alert Notes", alertNotes);
      });

      await test.step("Change source to non-triggering value — dependents hide", async () => {
        await clearDecimalField(page, "Threshold Score GTE");
        await fillDecimalField(page, "Threshold Score GTE", NON_TRIGGER_GTE);
        await checkVisibility(page, "GTE Alert Action", false);
        await checkVisibility(page, "GTE Alert Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [action, alertNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // DECIMAL 'less_or_equals' operator
  // Source: Threshold Score LTE → Dependents: LTE Alert Action [required], LTE Alert Notes [optional]
  // Threshold: 10 (dependents show when source ≤ 10)
  // ──────────────────────────────────────────────

  test.describe("'less_or_equals' operator", () => {
    test("T1: source > threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillDecimalField(page, "Threshold Score LTE", NON_TRIGGER_LTE);
        await checkVisibility(page, "LTE Alert Action", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["LTE Alert Action"]);
      });
    });

    test("T2: source > threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillDecimalField(page, "Threshold Score LTE", NON_TRIGGER_LTE);
        await checkVisibility(page, "LTE Alert Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["LTE Alert Notes"]);
      });
    });

    test("T3: source ≤ threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with triggering value — dependent appears", async () => {
        await fillDecimalField(page, "Threshold Score LTE", TRIGGER_LTE);
        await checkVisibility(page, "LTE Alert Action", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "LTE Alert Action");
      });
    });

    test("T4: source ≤ threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillDecimalField(page, "Threshold Score LTE", TRIGGER_LTE);
        await checkVisibility(page, "LTE Alert Action", true);
        await fillStringField(page, "LTE Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [action]);
      });
    });

    test("T5: source ≤ threshold → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source — optional dependent appears", async () => {
        await fillDecimalField(page, "Threshold Score LTE", TRIGGER_LTE);
        await checkVisibility(page, "LTE Alert Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "LTE Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [action], ["LTE Alert Notes"]);
      });
    });

    test("T6: source ≤ threshold → changed to > threshold → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);
      const alertNotes = faker.lorem.sentence();

      await test.step("Fill source with triggering value — dependents appear", async () => {
        await fillDecimalField(page, "Threshold Score LTE", TRIGGER_LTE);
        await checkVisibility(page, "LTE Alert Action", true);
        await checkVisibility(page, "LTE Alert Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "LTE Alert Action", action);
        await fillStringField(page, "LTE Alert Notes", alertNotes);
      });

      await test.step("Change source to non-triggering value — dependents hide", async () => {
        await clearDecimalField(page, "Threshold Score LTE");
        await fillDecimalField(page, "Threshold Score LTE", NON_TRIGGER_LTE);
        await checkVisibility(page, "LTE Alert Action", false);
        await checkVisibility(page, "LTE Alert Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherDecimalSources(page, "Threshold Score LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [action, alertNotes]);
      });
    });
  });
});
