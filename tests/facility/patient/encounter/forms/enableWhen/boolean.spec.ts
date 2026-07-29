import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  checkVisibility,
  clearBooleanField,
  expectFieldError,
  fillStringField,
  selectBooleanOption,
  submitAndExpectSuccess,
  submitForm,
  verifyLabelledValues,
  verifySubmittedValues,
} from "tests/helper/questionnaire";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

const QUESTIONNAIRE_SLUG = "enable-when-test";

test.describe("Enable When — Boolean Operators", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${QUESTIONNAIRE_SLUG}`,
    );
    await expect(
      page.getByText("Has Allergies", { exact: true }),
    ).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // BOOLEAN 'exists' operator
  // Source: Has Allergies → Dependents: List Known Allergies [required], Allergy Notes [optional]
  // ──────────────────────────────────────────────

  test.describe("'exists' operator", () => {
    test("T1: source unanswered → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Dependent hidden when source is unanswered", async () => {
        await checkVisibility(page, "List Known Allergies", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await selectBooleanOption(page, "Is Smoker", "No");
        await selectBooleanOption(page, "Is Conscious", "Yes");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and hidden dependent absent", async () => {
        await verifyLabelledValues(page, [
          ["Is Smoker", "No"],
          ["Is Conscious", "Yes"],
        ]);
        await verifySubmittedValues(page, [], ["List Known Allergies"]);
      });
    });

    test("T2: source unanswered → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Dependent hidden when source is unanswered", async () => {
        await checkVisibility(page, "Allergy Notes", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await selectBooleanOption(page, "Is Smoker", "No");
        await selectBooleanOption(page, "Is Conscious", "Yes");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and hidden dependent absent", async () => {
        await verifyLabelledValues(page, [
          ["Is Smoker", "No"],
          ["Is Conscious", "Yes"],
        ]);
        await verifySubmittedValues(page, [], ["Allergy Notes"]);
      });
    });

    test("T3: source answered → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Select source — dependent appears", async () => {
        await selectBooleanOption(page, "Has Allergies", "Yes");
        await checkVisibility(page, "List Known Allergies", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "List Known Allergies");
      });
    });

    test("T4: source answered → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const allergies = faker.lorem.words(3);

      await test.step("Select source and fill required dependent", async () => {
        await selectBooleanOption(page, "Has Allergies", "Yes");
        await checkVisibility(page, "List Known Allergies", true);
        await fillStringField(page, "List Known Allergies", allergies);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [allergies]);
      });
    });

    test("T5: source answered → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const allergies = faker.lorem.words(3);

      await test.step("Select source — optional dependent appears", async () => {
        await selectBooleanOption(page, "Has Allergies", "No");
        await checkVisibility(page, "Allergy Notes", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "List Known Allergies", allergies);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and optional absent", async () => {
        await verifySubmittedValues(page, [allergies], ["Allergy Notes"]);
      });
    });

    test("T6: source answered then cleared → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const allergies = faker.lorem.words(3);
      const allergyNotes = faker.lorem.sentence();

      await test.step("Select source — dependents appear", async () => {
        await selectBooleanOption(page, "Has Allergies", "Yes");
        await checkVisibility(page, "List Known Allergies", true);
        await checkVisibility(page, "Allergy Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "List Known Allergies", allergies);
        await fillStringField(page, "Allergy Notes", allergyNotes);
      });

      await test.step("Clear source — dependents hide", async () => {
        await clearBooleanField(page, "Has Allergies", "Yes");
        await checkVisibility(page, "List Known Allergies", false);
        await checkVisibility(page, "Allergy Notes", false);
      });

      await test.step("Fill other sources so form is submittable, then submit", async () => {
        await selectBooleanOption(page, "Is Smoker", "No");
        await selectBooleanOption(page, "Is Conscious", "Yes");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify hidden values not on overview", async () => {
        await verifyLabelledValues(page, [
          ["Is Smoker", "No"],
          ["Is Conscious", "Yes"],
        ]);
        await verifySubmittedValues(page, [], [allergies, allergyNotes]);
      });
    });
  });

  // ──────────────────────────────────────────────
  // BOOLEAN 'equals' operator
  // Source: Is Smoker → Dependents: Cigarettes Per Day [required], Smoking Duration [optional]
  // Match value: true (Yes)
  // ──────────────────────────────────────────────

  test.describe("'equals' operator", () => {
    test("T1: source = No → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Select No — dependent stays hidden", async () => {
        await selectBooleanOption(page, "Is Smoker", "No");
        await checkVisibility(page, "Cigarettes Per Day", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await selectBooleanOption(page, "Is Conscious", "Yes");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and hidden dependent absent", async () => {
        await verifyLabelledValues(page, [
          ["Is Smoker", "No"],
          ["Is Conscious", "Yes"],
        ]);
        await verifySubmittedValues(page, [], ["Cigarettes Per Day"]);
      });
    });

    test("T2: source = No → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Select No — dependent stays hidden", async () => {
        await selectBooleanOption(page, "Is Smoker", "No");
        await checkVisibility(page, "Smoking Duration", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await selectBooleanOption(page, "Is Conscious", "Yes");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and hidden dependent absent", async () => {
        await verifyLabelledValues(page, [
          ["Is Smoker", "No"],
          ["Is Conscious", "Yes"],
        ]);
        await verifySubmittedValues(page, [], ["Smoking Duration"]);
      });
    });

    test("T3: source = Yes → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Select Yes — dependent appears", async () => {
        await selectBooleanOption(page, "Is Smoker", "Yes");
        await checkVisibility(page, "Cigarettes Per Day", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Cigarettes Per Day");
      });
    });

    test("T4: source = Yes → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const cigarettesPerDay = faker.number.int({ min: 1, max: 40 }).toString();

      await test.step("Select Yes and fill required dependent", async () => {
        await selectBooleanOption(page, "Is Smoker", "Yes");
        await checkVisibility(page, "Cigarettes Per Day", true);
        await fillStringField(page, "Cigarettes Per Day", cigarettesPerDay);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [cigarettesPerDay]);
      });
    });

    test("T5: source = Yes → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const cigarettesPerDay = faker.number.int({ min: 1, max: 40 }).toString();

      await test.step("Select Yes — optional dependent appears", async () => {
        await selectBooleanOption(page, "Is Smoker", "Yes");
        await checkVisibility(page, "Smoking Duration", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Cigarettes Per Day", cigarettesPerDay);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and optional absent", async () => {
        await verifySubmittedValues(
          page,
          [cigarettesPerDay],
          ["Smoking Duration"],
        );
      });
    });

    test("T6: source = Yes → changed to No → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const cigarettesPerDay = faker.number.int({ min: 1, max: 40 }).toString();
      const smokingDuration = faker.lorem.words(2);

      await test.step("Select Yes — dependents appear", async () => {
        await selectBooleanOption(page, "Is Smoker", "Yes");
        await checkVisibility(page, "Cigarettes Per Day", true);
        await checkVisibility(page, "Smoking Duration", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Cigarettes Per Day", cigarettesPerDay);
        await fillStringField(page, "Smoking Duration", smokingDuration);
      });

      await test.step("Change source to No — dependents hide", async () => {
        await selectBooleanOption(page, "Is Smoker", "No");
        await checkVisibility(page, "Cigarettes Per Day", false);
        await checkVisibility(page, "Smoking Duration", false);
      });

      await test.step("Submit and verify hidden values not on overview", async () => {
        await submitAndExpectSuccess(page);
        await verifyLabelledValues(page, [["Is Smoker", "No"]]);
        await verifySubmittedValues(
          page,
          [],
          [cigarettesPerDay, smokingDuration],
        );
      });
    });
  });

  // ──────────────────────────────────────────────
  // BOOLEAN 'not_equals' operator
  // Source: Is Conscious → Dependents: Reason for Unconsciousness [required], Additional Observations [optional]
  // Match value: "Yes" (dependents show when source ≠ Yes, i.e., when No is selected)
  // ──────────────────────────────────────────────

  test.describe("'not_equals' operator", () => {
    test("T1: source = Yes → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Select Yes — dependent stays hidden", async () => {
        await selectBooleanOption(page, "Is Conscious", "Yes");
        await checkVisibility(page, "Reason for Unconsciousness", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await selectBooleanOption(page, "Is Smoker", "No");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and hidden dependent absent", async () => {
        await verifyLabelledValues(page, [
          ["Is Conscious", "Yes"],
          ["Is Smoker", "No"],
        ]);
        await verifySubmittedValues(page, [], ["Reason for Unconsciousness"]);
      });
    });

    test("T2: source = Yes → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Select Yes — dependent stays hidden", async () => {
        await selectBooleanOption(page, "Is Conscious", "Yes");
        await checkVisibility(page, "Additional Observations", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await selectBooleanOption(page, "Is Smoker", "No");
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and hidden dependent absent", async () => {
        await verifyLabelledValues(page, [
          ["Is Conscious", "Yes"],
          ["Is Smoker", "No"],
        ]);
        await verifySubmittedValues(page, [], ["Additional Observations"]);
      });
    });

    test("T3: source = No → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Select No — dependent appears", async () => {
        await selectBooleanOption(page, "Is Conscious", "No");
        await checkVisibility(page, "Reason for Unconsciousness", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Reason for Unconsciousness");
      });
    });

    test("T4: source = No → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const reason = faker.lorem.words(3);

      await test.step("Select No and fill required dependent", async () => {
        await selectBooleanOption(page, "Is Conscious", "No");
        await checkVisibility(page, "Reason for Unconsciousness", true);
        await fillStringField(page, "Reason for Unconsciousness", reason);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [reason]);
      });
    });

    test("T5: source = No → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const reason = faker.lorem.words(3);

      await test.step("Select No — optional dependent appears", async () => {
        await selectBooleanOption(page, "Is Conscious", "No");
        await checkVisibility(page, "Additional Observations", true);
      });

      await test.step("Fill required dependent, leave optional empty", async () => {
        await fillStringField(page, "Reason for Unconsciousness", reason);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview and optional absent", async () => {
        await verifySubmittedValues(
          page,
          [reason],
          ["Additional Observations"],
        );
      });
    });

    test("T6: source = No → changed to Yes → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const reason = faker.lorem.words(3);
      const observations = faker.lorem.sentence();

      await test.step("Select No — dependents appear", async () => {
        await selectBooleanOption(page, "Is Conscious", "No");
        await checkVisibility(page, "Reason for Unconsciousness", true);
        await checkVisibility(page, "Additional Observations", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Reason for Unconsciousness", reason);
        await fillStringField(page, "Additional Observations", observations);
      });

      await test.step("Change source to Yes — dependents hide", async () => {
        await selectBooleanOption(page, "Is Conscious", "Yes");
        await checkVisibility(page, "Reason for Unconsciousness", false);
        await checkVisibility(page, "Additional Observations", false);
      });

      await test.step("Submit and verify hidden values not on overview", async () => {
        await submitAndExpectSuccess(page);
        await verifyLabelledValues(page, [["Is Conscious", "Yes"]]);
        await verifySubmittedValues(page, [], [reason, observations]);
      });
    });
  });
});
