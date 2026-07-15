import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import {
  checkVisibility,
  clearIntegerField,
  expectFieldError,
  fillIntegerField,
  fillStringField,
  submitAndExpectSuccess,
  submitForm,
  verifySubmittedValues,
} from "tests/helper/questionnaire";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

const QUESTIONNAIRE_SLUG = "enable-when-test";

// Values that trigger/don't trigger each operator relative to threshold (15)
const TRIGGER_EXISTS = "5"; // any value triggers exists
const TRIGGER_EQUALS = "15"; // exactly 15
const NON_TRIGGER_EQUALS = "20"; // not 15
const TRIGGER_NOT_EQUALS = "20"; // anything except 15
const NON_TRIGGER_NOT_EQUALS = "15"; // exactly 15 — does NOT trigger not_equals
const TRIGGER_GREATER = "20"; // > 15
const NON_TRIGGER_GREATER = "5"; // ≤ 15
const TRIGGER_LESS = "5"; // < 15
const NON_TRIGGER_LESS = "20"; // ≥ 15
const TRIGGER_GTE = "15"; // ≥ 15 (boundary)
const NON_TRIGGER_GTE = "5"; // < 15
const TRIGGER_LTE = "15"; // ≤ 15 (boundary)
const NON_TRIGGER_LTE = "20"; // > 15

// Safe values for filling other integer source fields so required dependents don't block submit.
// Each safe value must NOT trigger the respective operator for that source.
const SAFE = {
  exists: undefined as string | undefined, // leave empty — no value means exists=false
  equals: NON_TRIGGER_EQUALS, // 20 — won't equal 15
  notEquals: NON_TRIGGER_NOT_EQUALS, // 15 — equals 15 so not_equals is false
  greater: NON_TRIGGER_GREATER, // 5 — not > 15
  less: NON_TRIGGER_LESS, // 20 — not < 15
  gte: NON_TRIGGER_GTE, // 5 — not ≥ 15
  lte: NON_TRIGGER_LTE, // 20 — not ≤ 15
};

/**
 * Fills all other integer source fields with safe (non-triggering) values
 * so their required dependents stay hidden and don't block form submission.
 * Skips the source being actively tested (identified by `excludeLabel`).
 */
async function fillOtherIntegerSources(page: Page, excludeLabel: string) {
  const sources: { label: string; value: string | undefined }[] = [
    { label: "Patient Count", value: SAFE.exists },
    { label: "Exact Match Count", value: SAFE.equals },
    { label: "Non-Standard Count", value: SAFE.notEquals },
    { label: "High Count", value: SAFE.greater },
    { label: "Low Count", value: SAFE.less },
    { label: "Threshold Count GTE", value: SAFE.gte },
    { label: "Threshold Count LTE", value: SAFE.lte },
  ];

  for (const { label, value } of sources) {
    if (label === excludeLabel) continue;
    if (value !== undefined) {
      await fillIntegerField(page, label, value);
    }
    // If value is undefined, leave field empty (safe for exists operator)
  }
}

test.describe("Enable When — Integer Operators", () => {
  // These tests submit to the same shared setup encounter and assert that
  // hidden labels/values are absent from the shared overview. Playwright runs
  // with fullyParallel: true, so run this block serially to avoid tests
  // polluting each other's overview results.
  test.describe.configure({ mode: "serial" });

  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${QUESTIONNAIRE_SLUG}`,
    );
    await expect(
      page.getByText("Patient Count", { exact: true }),
    ).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // INTEGER 'exists' operator
  // Source: Patient Count → Dependents: Count Interpretation [required], Count Comments [optional]
  // ──────────────────────────────────────────────

  test.describe("'exists' operator", () => {
    test("T1: source unanswered → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Dependent hidden when source is empty", async () => {
        await checkVisibility(page, "Count Interpretation", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Patient Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Count Interpretation"]);
      });
    });

    test("T2: source unanswered → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Dependent hidden when source is empty", async () => {
        await checkVisibility(page, "Count Comments", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Patient Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Count Comments"]);
      });
    });

    test("T3: source answered → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source — dependent appears", async () => {
        await fillIntegerField(page, "Patient Count", TRIGGER_EXISTS);
        await checkVisibility(page, "Count Interpretation", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Count Interpretation");
      });
    });

    test("T4: source answered → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const interpretation = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillIntegerField(page, "Patient Count", TRIGGER_EXISTS);
        await checkVisibility(page, "Count Interpretation", true);
        await fillStringField(page, "Count Interpretation", interpretation);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Patient Count");
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
        await fillIntegerField(page, "Patient Count", TRIGGER_EXISTS);
        await checkVisibility(page, "Count Comments", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Count Interpretation", interpretation);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Patient Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [interpretation], ["Count Comments"]);
      });
    });

    test("T6: source answered then cleared → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const interpretation = faker.lorem.words(3);
      const comments = faker.lorem.sentence();

      await test.step("Fill source — dependents appear", async () => {
        await fillIntegerField(page, "Patient Count", TRIGGER_EXISTS);
        await checkVisibility(page, "Count Interpretation", true);
        await checkVisibility(page, "Count Comments", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Count Interpretation", interpretation);
        await fillStringField(page, "Count Comments", comments);
      });

      await test.step("Clear source — dependents hide", async () => {
        await clearIntegerField(page, "Patient Count");
        await checkVisibility(page, "Count Interpretation", false);
        await checkVisibility(page, "Count Comments", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Patient Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [interpretation, comments]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // INTEGER 'equals' operator
  // Source: Exact Match Count → Dependents: Match Count Diagnosis [required], Match Count Notes [optional]
  // Match value: "15"
  // ──────────────────────────────────────────────

  test.describe("'equals' operator", () => {
    test("T1: source ≠ threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-matching value — dependent hidden", async () => {
        await fillIntegerField(page, "Exact Match Count", NON_TRIGGER_EQUALS);
        await checkVisibility(page, "Match Count Diagnosis", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Exact Match Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Match Count Diagnosis"]);
      });
    });

    test("T2: source ≠ threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-matching value — dependent hidden", async () => {
        await fillIntegerField(page, "Exact Match Count", NON_TRIGGER_EQUALS);
        await checkVisibility(page, "Match Count Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Exact Match Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Match Count Notes"]);
      });
    });

    test("T3: source = threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with matching value — dependent appears", async () => {
        await fillIntegerField(page, "Exact Match Count", TRIGGER_EQUALS);
        await checkVisibility(page, "Match Count Diagnosis", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Match Count Diagnosis");
      });
    });

    test("T4: source = threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const diagnosis = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillIntegerField(page, "Exact Match Count", TRIGGER_EQUALS);
        await checkVisibility(page, "Match Count Diagnosis", true);
        await fillStringField(page, "Match Count Diagnosis", diagnosis);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Exact Match Count");
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
        await fillIntegerField(page, "Exact Match Count", TRIGGER_EQUALS);
        await checkVisibility(page, "Match Count Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Match Count Diagnosis", diagnosis);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Exact Match Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [diagnosis], ["Match Count Notes"]);
      });
    });

    test("T6: source = threshold → changed to non-match → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const diagnosis = faker.lorem.words(3);
      const notes = faker.lorem.sentence();

      await test.step("Fill source with matching value — dependents appear", async () => {
        await fillIntegerField(page, "Exact Match Count", TRIGGER_EQUALS);
        await checkVisibility(page, "Match Count Diagnosis", true);
        await checkVisibility(page, "Match Count Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Match Count Diagnosis", diagnosis);
        await fillStringField(page, "Match Count Notes", notes);
      });

      await test.step("Change source to non-matching value — dependents hide", async () => {
        await clearIntegerField(page, "Exact Match Count");
        await fillIntegerField(page, "Exact Match Count", NON_TRIGGER_EQUALS);
        await checkVisibility(page, "Match Count Diagnosis", false);
        await checkVisibility(page, "Match Count Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Exact Match Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [diagnosis, notes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // INTEGER 'not_equals' operator
  // Source: Non-Standard Count → Dependents: Count Deviation Reason [required], Count Deviation Notes [optional]
  // Match value: "15" (dependents show when source ≠ 15)
  // ──────────────────────────────────────────────

  test.describe("'not_equals' operator", () => {
    test("T1: source = threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with matching value — dependent stays hidden", async () => {
        await fillIntegerField(
          page,
          "Non-Standard Count",
          NON_TRIGGER_NOT_EQUALS,
        );
        await checkVisibility(page, "Count Deviation Reason", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Non-Standard Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Count Deviation Reason"]);
      });
    });

    test("T2: source = threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with matching value — dependent stays hidden", async () => {
        await fillIntegerField(
          page,
          "Non-Standard Count",
          NON_TRIGGER_NOT_EQUALS,
        );
        await checkVisibility(page, "Count Deviation Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Non-Standard Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Count Deviation Notes"]);
      });
    });

    test("T3: source ≠ threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with non-matching value — dependent appears", async () => {
        await fillIntegerField(page, "Non-Standard Count", TRIGGER_NOT_EQUALS);
        await checkVisibility(page, "Count Deviation Reason", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Count Deviation Reason");
      });
    });

    test("T4: source ≠ threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const reason = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillIntegerField(page, "Non-Standard Count", TRIGGER_NOT_EQUALS);
        await checkVisibility(page, "Count Deviation Reason", true);
        await fillStringField(page, "Count Deviation Reason", reason);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Non-Standard Count");
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
        await fillIntegerField(page, "Non-Standard Count", TRIGGER_NOT_EQUALS);
        await checkVisibility(page, "Count Deviation Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Count Deviation Reason", reason);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Non-Standard Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [reason], ["Count Deviation Notes"]);
      });
    });

    test("T6: source ≠ threshold → changed to match → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const reason = faker.lorem.words(3);
      const devNotes = faker.lorem.sentence();

      await test.step("Fill source with non-matching value — dependents appear", async () => {
        await fillIntegerField(page, "Non-Standard Count", TRIGGER_NOT_EQUALS);
        await checkVisibility(page, "Count Deviation Reason", true);
        await checkVisibility(page, "Count Deviation Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Count Deviation Reason", reason);
        await fillStringField(page, "Count Deviation Notes", devNotes);
      });

      await test.step("Change source to matching value — dependents hide", async () => {
        await clearIntegerField(page, "Non-Standard Count");
        await fillIntegerField(
          page,
          "Non-Standard Count",
          NON_TRIGGER_NOT_EQUALS,
        );
        await checkVisibility(page, "Count Deviation Reason", false);
        await checkVisibility(page, "Count Deviation Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Non-Standard Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [reason, devNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // INTEGER 'greater' operator
  // Source: High Count → Dependents: High Count Alert Action [required], High Count Alert Notes [optional]
  // Threshold: 15 (dependents show when source > 15)
  // ──────────────────────────────────────────────

  test.describe("'greater' operator", () => {
    test("T1: source ≤ threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillIntegerField(page, "High Count", NON_TRIGGER_GREATER);
        await checkVisibility(page, "High Count Alert Action", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "High Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["High Count Alert Action"]);
      });
    });

    test("T2: source ≤ threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillIntegerField(page, "High Count", NON_TRIGGER_GREATER);
        await checkVisibility(page, "High Count Alert Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "High Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["High Count Alert Notes"]);
      });
    });

    test("T3: source > threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with triggering value — dependent appears", async () => {
        await fillIntegerField(page, "High Count", TRIGGER_GREATER);
        await checkVisibility(page, "High Count Alert Action", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "High Count Alert Action");
      });
    });

    test("T4: source > threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillIntegerField(page, "High Count", TRIGGER_GREATER);
        await checkVisibility(page, "High Count Alert Action", true);
        await fillStringField(page, "High Count Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "High Count");
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
        await fillIntegerField(page, "High Count", TRIGGER_GREATER);
        await checkVisibility(page, "High Count Alert Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "High Count Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "High Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [action], ["High Count Alert Notes"]);
      });
    });

    test("T6: source > threshold → changed to ≤ threshold → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);
      const alertNotes = faker.lorem.sentence();

      await test.step("Fill source with triggering value — dependents appear", async () => {
        await fillIntegerField(page, "High Count", TRIGGER_GREATER);
        await checkVisibility(page, "High Count Alert Action", true);
        await checkVisibility(page, "High Count Alert Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "High Count Alert Action", action);
        await fillStringField(page, "High Count Alert Notes", alertNotes);
      });

      await test.step("Change source to non-triggering value — dependents hide", async () => {
        await clearIntegerField(page, "High Count");
        await fillIntegerField(page, "High Count", NON_TRIGGER_GREATER);
        await checkVisibility(page, "High Count Alert Action", false);
        await checkVisibility(page, "High Count Alert Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "High Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [action, alertNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // INTEGER 'less' operator
  // Source: Low Count → Dependents: Low Count Alert Action [required], Low Count Alert Notes [optional]
  // Threshold: 15 (dependents show when source < 15)
  // ──────────────────────────────────────────────

  test.describe("'less' operator", () => {
    test("T1: source ≥ threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillIntegerField(page, "Low Count", NON_TRIGGER_LESS);
        await checkVisibility(page, "Low Count Alert Action", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Low Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Low Count Alert Action"]);
      });
    });

    test("T2: source ≥ threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillIntegerField(page, "Low Count", NON_TRIGGER_LESS);
        await checkVisibility(page, "Low Count Alert Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Low Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["Low Count Alert Notes"]);
      });
    });

    test("T3: source < threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with triggering value — dependent appears", async () => {
        await fillIntegerField(page, "Low Count", TRIGGER_LESS);
        await checkVisibility(page, "Low Count Alert Action", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Low Count Alert Action");
      });
    });

    test("T4: source < threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillIntegerField(page, "Low Count", TRIGGER_LESS);
        await checkVisibility(page, "Low Count Alert Action", true);
        await fillStringField(page, "Low Count Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Low Count");
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
        await fillIntegerField(page, "Low Count", TRIGGER_LESS);
        await checkVisibility(page, "Low Count Alert Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Low Count Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Low Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [action], ["Low Count Alert Notes"]);
      });
    });

    test("T6: source < threshold → changed to ≥ threshold → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);
      const alertNotes = faker.lorem.sentence();

      await test.step("Fill source with triggering value — dependents appear", async () => {
        await fillIntegerField(page, "Low Count", TRIGGER_LESS);
        await checkVisibility(page, "Low Count Alert Action", true);
        await checkVisibility(page, "Low Count Alert Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Low Count Alert Action", action);
        await fillStringField(page, "Low Count Alert Notes", alertNotes);
      });

      await test.step("Change source to non-triggering value — dependents hide", async () => {
        await clearIntegerField(page, "Low Count");
        await fillIntegerField(page, "Low Count", NON_TRIGGER_LESS);
        await checkVisibility(page, "Low Count Alert Action", false);
        await checkVisibility(page, "Low Count Alert Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Low Count");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [action, alertNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // INTEGER 'greater_or_equals' operator
  // Source: Threshold Count GTE → Dependents: GTE Count Alert Action [required], GTE Count Alert Notes [optional]
  // Threshold: 15 (dependents show when source ≥ 15)
  // ──────────────────────────────────────────────

  test.describe("'greater_or_equals' operator", () => {
    test("T1: source < threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillIntegerField(page, "Threshold Count GTE", NON_TRIGGER_GTE);
        await checkVisibility(page, "GTE Count Alert Action", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["GTE Count Alert Action"]);
      });
    });

    test("T2: source < threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillIntegerField(page, "Threshold Count GTE", NON_TRIGGER_GTE);
        await checkVisibility(page, "GTE Count Alert Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["GTE Count Alert Notes"]);
      });
    });

    test("T3: source ≥ threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with triggering value — dependent appears", async () => {
        await fillIntegerField(page, "Threshold Count GTE", TRIGGER_GTE);
        await checkVisibility(page, "GTE Count Alert Action", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "GTE Count Alert Action");
      });
    });

    test("T4: source ≥ threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillIntegerField(page, "Threshold Count GTE", TRIGGER_GTE);
        await checkVisibility(page, "GTE Count Alert Action", true);
        await fillStringField(page, "GTE Count Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count GTE");
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
        await fillIntegerField(page, "Threshold Count GTE", TRIGGER_GTE);
        await checkVisibility(page, "GTE Count Alert Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "GTE Count Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [action], ["GTE Count Alert Notes"]);
      });
    });

    test("T6: source ≥ threshold → changed to < threshold → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);
      const alertNotes = faker.lorem.sentence();

      await test.step("Fill source with triggering value — dependents appear", async () => {
        await fillIntegerField(page, "Threshold Count GTE", TRIGGER_GTE);
        await checkVisibility(page, "GTE Count Alert Action", true);
        await checkVisibility(page, "GTE Count Alert Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "GTE Count Alert Action", action);
        await fillStringField(page, "GTE Count Alert Notes", alertNotes);
      });

      await test.step("Change source to non-triggering value — dependents hide", async () => {
        await clearIntegerField(page, "Threshold Count GTE");
        await fillIntegerField(page, "Threshold Count GTE", NON_TRIGGER_GTE);
        await checkVisibility(page, "GTE Count Alert Action", false);
        await checkVisibility(page, "GTE Count Alert Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count GTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [action, alertNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // INTEGER 'less_or_equals' operator
  // Source: Threshold Count LTE → Dependents: LTE Count Alert Action [required], LTE Count Alert Notes [optional]
  // Threshold: 15 (dependents show when source ≤ 15)
  // ──────────────────────────────────────────────

  test.describe("'less_or_equals' operator", () => {
    test("T1: source > threshold → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillIntegerField(page, "Threshold Count LTE", NON_TRIGGER_LTE);
        await checkVisibility(page, "LTE Count Alert Action", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["LTE Count Alert Action"]);
      });
    });

    test("T2: source > threshold → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Fill source with non-triggering value — dependent hidden", async () => {
        await fillIntegerField(page, "Threshold Count LTE", NON_TRIGGER_LTE);
        await checkVisibility(page, "LTE Count Alert Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden dependent absent from overview", async () => {
        await verifySubmittedValues(page, [], ["LTE Count Alert Notes"]);
      });
    });

    test("T3: source ≤ threshold → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Fill source with triggering value — dependent appears", async () => {
        await fillIntegerField(page, "Threshold Count LTE", TRIGGER_LTE);
        await checkVisibility(page, "LTE Count Alert Action", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "LTE Count Alert Action");
      });
    });

    test("T4: source ≤ threshold → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);

      await test.step("Fill source and required dependent", async () => {
        await fillIntegerField(page, "Threshold Count LTE", TRIGGER_LTE);
        await checkVisibility(page, "LTE Count Alert Action", true);
        await fillStringField(page, "LTE Count Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count LTE");
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
        await fillIntegerField(page, "Threshold Count LTE", TRIGGER_LTE);
        await checkVisibility(page, "LTE Count Alert Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "LTE Count Alert Action", action);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values and optional absent", async () => {
        await verifySubmittedValues(page, [action], ["LTE Count Alert Notes"]);
      });
    });

    test("T6: source ≤ threshold → changed to > threshold → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const action = faker.lorem.words(3);
      const alertNotes = faker.lorem.sentence();

      await test.step("Fill source with triggering value — dependents appear", async () => {
        await fillIntegerField(page, "Threshold Count LTE", TRIGGER_LTE);
        await checkVisibility(page, "LTE Count Alert Action", true);
        await checkVisibility(page, "LTE Count Alert Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "LTE Count Alert Action", action);
        await fillStringField(page, "LTE Count Alert Notes", alertNotes);
      });

      await test.step("Change source to non-triggering value — dependents hide", async () => {
        await clearIntegerField(page, "Threshold Count LTE");
        await fillIntegerField(page, "Threshold Count LTE", NON_TRIGGER_LTE);
        await checkVisibility(page, "LTE Count Alert Action", false);
        await checkVisibility(page, "LTE Count Alert Notes", false);
      });

      await test.step("Fill other sources and submit", async () => {
        await fillOtherIntegerSources(page, "Threshold Count LTE");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifySubmittedValues(page, [], [action, alertNotes]);
      });
    });
  });
});
