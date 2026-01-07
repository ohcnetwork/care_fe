import { Page, test } from "@playwright/test";
import { expectQuestionnaireFieldError } from "tests/helper/error";
import {
  checkVisibility,
  clearFormField,
  fillFormField,
  submitAndVerify,
} from "tests/helper/questionnaire";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

const QUESTIONNAIRE_SLUG = "enable-when-test";

// Shared test data to reduce duplication
const BASE_FORM_DATA = {
  age: "30",
  gender: "male",
  smokingStatus: "never",
  bmi: "24",
};

// Helper to fill base required fields quickly
async function fillBaseFields(
  page: Page,
  overrides: Partial<{
    age: string;
    gender: string;
    smokingStatus: string;
    bmi: string;
  }> = {},
) {
  const data = { ...BASE_FORM_DATA, ...overrides };
  await fillFormField(page, "Patient Age", "input", data.age);
  await fillFormField(page, "Gender", "radio", data.gender);
  await fillFormField(page, "Smoking Status", "radio", data.smokingStatus);

  // Only fill BMI if age is in valid range (18-64)
  const ageNum = parseInt(data.age);
  if (ageNum >= 18 && ageNum <= 64) {
    await fillFormField(page, "BMI (Body Mass Index)", "input", data.bmi);
  }
}

test.describe("Enable When Functionality Tests", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${QUESTIONNAIRE_SLUG}`,
    );
    await page.waitForLoadState("networkidle");
  });

  test.describe("String 'exists' operator", () => {
    /**
     * Tests the 'exists' operator for string fields
     * Coverage:
     * - Operator: exists (checks if field has any value)
     * - Type: string
     * - Scenario: Middle Name field appears when Patient Name is filled
     * - Validation: Hidden required field (Middle Name) doesn't block submission
     */
    test("should toggle middle name visibility based on patient name", async ({
      page,
    }) => {
      const firstName = "John";
      const middleName = "Michael";

      await checkVisibility(page, "Middle Name", false);

      await fillFormField(page, "Patient Name", "input", firstName);
      await checkVisibility(page, "Middle Name", true);

      await fillFormField(page, "Middle Name", "input", middleName);
      await fillBaseFields(page);

      await submitAndVerify(page, [
        firstName,
        middleName,
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });

    /**
     * Tests field hiding when condition is no longer met
     * Coverage:
     * - Dynamic visibility: Field disappears when value is cleared
     * - Validation: Form submits successfully without conditionally hidden field
     */
    test("should hide middle name when patient name is cleared", async ({
      page,
    }) => {
      await fillFormField(page, "Patient Name", "input", "John");
      await checkVisibility(page, "Middle Name", true);

      await clearFormField(page, "Patient Name");
      await checkVisibility(page, "Middle Name", false);

      await fillBaseFields(page);
      await submitAndVerify(page, [
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });
  });

  test.describe("String 'equals' operator", () => {
    /**
     * Tests the 'equals' operator for string fields
     * Coverage:
     * - Operator: equals (checks for exact string match)
     * - Type: string
     * - Scenario: License field appears only when Professional Type is "Doctor"
     * - Validation: Required field validation works for conditionally shown fields
     */
    test("should show license field only for doctors", async ({ page }) => {
      const professionalType = "Doctor";
      const licenseNumber = "MD12345";

      await checkVisibility(page, "Medical License Number", false);

      await fillFormField(page, "Professional Type", "input", "Nurse");
      await checkVisibility(page, "Medical License Number", false);

      await fillFormField(page, "Professional Type", "input", professionalType);
      await checkVisibility(page, "Medical License Number", true);
      await fillFormField(
        page,
        "Medical License Number",
        "input",
        licenseNumber,
      );

      await fillBaseFields(page);
      await submitAndVerify(page, [
        professionalType,
        licenseNumber,
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });

    /**
     * Tests validation error for visible required field
     * Coverage:
     * - Required field validation when condition is met
     * - Error message display for unfilled required fields
     */
    test("should require license when professional type is doctor", async ({
      page,
    }) => {
      await fillFormField(page, "Professional Type", "input", "Doctor");
      await checkVisibility(page, "Medical License Number", true);

      await fillBaseFields(page);
      await page.getByRole("button", { name: /submit|save/i }).click();

      await expectQuestionnaireFieldError(page, "Medical License Number");
    });
  });

  test.describe("String 'not_equals' operator", () => {
    /**
     * Tests the 'not_equals' operator for string fields
     * Coverage:
     * - Operator: not_equals (checks for non-matching string)
     * - Type: string
     * - Scenario: Specification field appears when Category is not "Standard"
     * - Validation: Required field when condition is met
     */
    test("should show specification field for non-standard categories", async ({
      page,
    }) => {
      const category = "Custom";
      const specification = "Custom Type A";

      await checkVisibility(page, "Specify Other Category", false);

      await fillFormField(page, "Category", "input", "Standard");
      await checkVisibility(page, "Specify Other Category", false);

      await fillFormField(page, "Category", "input", category);
      await checkVisibility(page, "Specify Other Category", true);
      await fillFormField(
        page,
        "Specify Other Category",
        "input",
        specification,
      );

      await fillBaseFields(page);
      await submitAndVerify(page, [
        category,
        specification,
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });

    /**
     * Tests that hidden required fields don't block submission
     * Coverage:
     * - not_equals operator correctly hides field when condition matches
     * - Form submission succeeds when required field is hidden
     */
    test("should not require specification for standard category", async ({
      page,
    }) => {
      await fillFormField(page, "Category", "input", "Standard");
      await checkVisibility(page, "Specify Other Category", false);

      await fillBaseFields(page);
      await submitAndVerify(page, [
        "Standard",
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });
  });

  test.describe("Choice 'equals' operator", () => {
    /**
     * Tests the 'equals' operator for choice (radio/select) fields
     * Coverage:
     * - Operator: equals (checks for specific choice value)
     * - Type: choice
     * - Scenario: Pregnancy question appears only for female gender
     * - Validation: Field visibility toggles correctly with different choices
     */
    test("should show pregnancy question only for female gender", async ({
      page,
    }) => {
      // Fill base fields first (age, smoking status, BMI)
      await fillFormField(page, "Patient Age", "input", BASE_FORM_DATA.age);
      await fillFormField(
        page,
        "Smoking Status",
        "radio",
        BASE_FORM_DATA.smokingStatus,
      );
      await fillFormField(
        page,
        "BMI (Body Mass Index)",
        "input",
        BASE_FORM_DATA.bmi,
      );

      await checkVisibility(page, "Are you currently pregnant?", false);

      await fillFormField(page, "Gender", "radio", "male");
      await checkVisibility(page, "Are you currently pregnant?", false);

      await fillFormField(page, "Gender", "radio", "female");
      await checkVisibility(page, "Are you currently pregnant?", true);

      await fillFormField(page, "Gender", "radio", "other");
      await checkVisibility(page, "Are you currently pregnant?", false);

      await submitAndVerify(page, [
        BASE_FORM_DATA.age,
        "other",
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });

    /**
     * Tests choice-dependent field visibility for smoking status
     * Coverage:
     * - equals operator with choice type
     * - Scenario: Years Since Quit appears only for former smokers
     */
    test("should show quit years for former smokers only", async ({ page }) => {
      const smokingStatus = "former";
      const quitYears = "2";

      // Fill base fields first to ensure form is in valid state
      await fillFormField(page, "Patient Age", "input", BASE_FORM_DATA.age);
      await fillFormField(page, "Gender", "radio", BASE_FORM_DATA.gender);
      await fillFormField(
        page,
        "BMI (Body Mass Index)",
        "input",
        BASE_FORM_DATA.bmi,
      );

      await checkVisibility(page, "Years Since Quit Smoking", false);

      await fillFormField(page, "Smoking Status", "radio", "never");
      await checkVisibility(page, "Years Since Quit Smoking", false);

      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await checkVisibility(page, "Years Since Quit Smoking", true);
      await fillFormField(page, "Years Since Quit Smoking", "input", quitYears);

      await submitAndVerify(page, [
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        smokingStatus,
        quitYears,
        BASE_FORM_DATA.bmi,
      ]);
    });

    /**
     * Tests another choice-dependent scenario
     * Coverage:
     * - equals operator for current smokers
     * - Scenario: Cessation counseling offer appears only for current smokers
     */
    test("should show cessation counseling for current smokers only", async ({
      page,
    }) => {
      const counselingQuestion = "Would you like smoking cessation counseling?";
      await checkVisibility(page, counselingQuestion, false);

      await fillFormField(page, "Smoking Status", "radio", "current");
      await checkVisibility(page, counselingQuestion, true);

      await fillFormField(page, "Smoking Status", "radio", "former");
      await checkVisibility(page, counselingQuestion, false);
    });
  });

  test.describe("Integer comparison operators", () => {
    /**
     * Tests the 'greater_or_equals' operator for integer fields
     * Coverage:
     * - Operator: greater_or_equals (>=)
     * - Type: integer
     * - Scenario: Senior screening appears for ages 65 and above
     * - Boundary testing: Validates exact boundary (64 vs 65)
     */
    test("should show senior screening for age >= 65", async ({ page }) => {
      const seniorField = "Senior Health Screening Required";
      await checkVisibility(page, seniorField, false);

      await fillFormField(page, "Patient Age", "input", "64");
      await checkVisibility(page, seniorField, false);

      await fillFormField(page, "Patient Age", "input", "65");
      await checkVisibility(page, seniorField, true);

      await fillBaseFields(page, { age: "70" });
      await submitAndVerify(page, [
        "70",
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
      ]);
    });

    /**
     * Tests the 'less' operator for integer fields
     * Coverage:
     * - Operator: less (<)
     * - Type: integer
     * - Scenario: Pediatric assessment appears for ages under 18
     * - Boundary testing: Validates exact boundary (17 vs 18)
     */
    test("should show pediatric assessment for age < 18", async ({ page }) => {
      const pediatricField = "Pediatric Assessment Required";
      await checkVisibility(page, pediatricField, false);

      await fillFormField(page, "Patient Age", "input", "17");
      await checkVisibility(page, pediatricField, true);

      await fillFormField(page, "Patient Age", "input", "18");
      await checkVisibility(page, pediatricField, false);

      await fillBaseFields(page, { age: "5" });
      await submitAndVerify(page, [
        "5",
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
      ]);
    });
  });

  test.describe("Multiple conditions with 'all' behavior", () => {
    /**
     * Tests 'all' enable behavior with multiple integer conditions
     * Coverage:
     * - Enable behavior: all (ALL conditions must be true)
     * - Operators: greater (>17) AND less_or_equals (<=64)
     * - Type: integer
     * - Scenario: BMI field shown only for adult age range (18-64)
     * - Boundary testing: Multiple boundaries (17/18 and 64/65)
     * - Validation: Required field only enforced when visible
     */
    test("should show BMI only for ages 18-64", async ({ page }) => {
      const bmiField = "BMI (Body Mass Index)";
      await checkVisibility(page, bmiField, false);

      await fillFormField(page, "Patient Age", "input", "17");
      await checkVisibility(page, bmiField, false);

      await fillFormField(page, "Patient Age", "input", "18");
      await checkVisibility(page, bmiField, true);

      await fillFormField(page, "Patient Age", "input", "64");
      await checkVisibility(page, bmiField, true);

      await fillFormField(page, "Patient Age", "input", "65");
      await checkVisibility(page, bmiField, false);

      await fillBaseFields(page);
      await submitAndVerify(page, [
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });

    /**
     * Tests that hidden required fields don't block submission
     * Coverage:
     * - Required field validation skipped when field is hidden
     * - Form submits successfully with age outside BMI range
     */
    test("should not require BMI when hidden (outside age range)", async ({
      page,
    }) => {
      await fillBaseFields(page, { age: "17" });
      await submitAndVerify(page, [
        "17",
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
      ]);
    });

    /**
     * Tests required field validation when condition is met
     * Coverage:
     * - Visible required fields must be filled
     * - Validation error displayed for empty required field
     */
    test("should require BMI when visible (age 18-64)", async ({ page }) => {
      await fillFormField(page, "Patient Age", "input", BASE_FORM_DATA.age);
      await fillFormField(page, "Gender", "radio", BASE_FORM_DATA.gender);
      await fillFormField(
        page,
        "Smoking Status",
        "radio",
        BASE_FORM_DATA.smokingStatus,
      );

      await checkVisibility(page, "BMI (Body Mass Index)", true);
      await page.getByRole("button", { name: /submit|save/i }).click();
      await expectQuestionnaireFieldError(page, "BMI (Body Mass Index)");
    });

    /**
     * Tests 'all' behavior with exists and comparison operators
     * Coverage:
     * - Enable behavior: all (both conditions required)
     * - Operators: exists AND greater (>140)
     * - Type: integer
     * - Scenario: Alert shown only when BP is entered AND exceeds threshold
     * - Boundary testing: 140 vs 141
     */
    test("should show hypertension alert when BP exists AND > 140", async ({
      page,
    }) => {
      const alertField = "⚠️ Hypertension Alert - Please consult physician";
      await checkVisibility(page, alertField, false);

      await fillFormField(page, "Systolic Blood Pressure", "input", "140");
      await checkVisibility(page, alertField, false);

      await fillFormField(page, "Systolic Blood Pressure", "input", "141");
      await checkVisibility(page, alertField, true);

      await fillBaseFields(page);
      await submitAndVerify(page, [
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });
  });

  test.describe("Choice 'not_equals' with 'any' behavior", () => {
    /**
     * Tests 'any' enable behavior with mixed operators
     * Coverage:
     * - Enable behavior: any (at least one condition must be true)
     * - Operators: greater_or_equals (age>=50) OR not_equals (smoking!="never")
     * - Types: integer AND choice
     * - Scenario: High risk alert shown if EITHER age>=50 OR not never-smoker
     * - Logic testing: Multiple combinations of conditions
     */
    test("should show high risk screening for age 50+ OR non-never smoker", async ({
      page,
    }) => {
      const highRiskField = "High Risk Patient - Additional Screening Required";
      await checkVisibility(page, highRiskField, false);

      // Age 49, never smoker - should not show
      await fillFormField(page, "Patient Age", "input", "49");
      await fillFormField(page, "Smoking Status", "radio", "never");
      await checkVisibility(page, highRiskField, false);

      // Age 50, never smoker - should show (age condition met)
      await fillFormField(page, "Patient Age", "input", "50");
      await checkVisibility(page, highRiskField, true);

      // Age 49, former smoker - should show (smoking condition met)
      await fillFormField(page, "Patient Age", "input", "49");
      await fillFormField(page, "Smoking Status", "radio", "former");
      await checkVisibility(page, highRiskField, true);

      const finalAge = "55";
      const finalSmokingStatus = "current";

      await fillBaseFields(page, {
        age: finalAge,
        smokingStatus: finalSmokingStatus,
      });
      await submitAndVerify(page, [
        finalAge,
        BASE_FORM_DATA.gender,
        finalSmokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });
  });

  test.describe("Complex scenarios", () => {
    /**
     * Tests multiple hidden required fields simultaneously
     * Coverage:
     * - Multiple conditions evaluated together
     * - Multiple required fields hidden at once
     * - Form submission succeeds despite multiple unfilled required fields
     * - Validates: Middle Name, BMI, Pregnancy, Years Since Quit (all hidden)
     */
    test("should submit with multiple hidden required fields", async ({
      page,
    }) => {
      await fillBaseFields(page, { age: "65" });

      await checkVisibility(page, "Middle Name", false);
      await checkVisibility(page, "BMI (Body Mass Index)", false);
      await checkVisibility(page, "Are you currently pregnant?", false);
      await checkVisibility(page, "Years Since Quit Smoking", false);

      await submitAndVerify(page, [
        "65",
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
      ]);
    });

    /**
     * Tests validation of visible required fields
     * Coverage:
     * - Mixed scenario: some fields visible, some hidden
     * - Validation: Visible required fields still enforce validation
     * - Error handling: Proper error display for visible unfilled fields
     */
    test("should validate visible required fields", async ({ page }) => {
      await fillFormField(page, "Patient Age", "input", BASE_FORM_DATA.age);
      await fillFormField(page, "Gender", "radio", "female");

      await page.getByRole("button", { name: /submit|save/i }).click();
      await expectQuestionnaireFieldError(page, "Smoking Status");
    });

    /**
     * Tests rapid condition changes and state management
     * Coverage:
     * - Dynamic visibility: Multiple rapid changes to trigger field
     * - State consistency: Field state updates correctly with each change
     * - No race conditions or stale state issues
     */
    test("should handle rapid visibility changes", async ({ page }) => {
      const pregnancyField = "Are you currently pregnant?";

      // Fill base fields first
      await fillFormField(page, "Patient Age", "input", BASE_FORM_DATA.age);
      await fillFormField(
        page,
        "Smoking Status",
        "radio",
        BASE_FORM_DATA.smokingStatus,
      );
      await fillFormField(
        page,
        "BMI (Body Mass Index)",
        "input",
        BASE_FORM_DATA.bmi,
      );

      await fillFormField(page, "Gender", "radio", "female");
      await checkVisibility(page, pregnancyField, true);

      await fillFormField(page, "Gender", "radio", "male");
      await checkVisibility(page, pregnancyField, false);

      await fillFormField(page, "Gender", "radio", "female");
      await checkVisibility(page, pregnancyField, true);

      await fillFormField(page, "Gender", "radio", "other");
      await checkVisibility(page, pregnancyField, false);

      await submitAndVerify(page, [
        BASE_FORM_DATA.age,
        "other",
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });
  });

  test.describe("Edge cases and boundaries", () => {
    /**
     * Tests exact boundary values for all comparison operators
     * Coverage:
     * - Boundary testing: Exact threshold values (64/65, 17/18, 140/141)
     * - Operators tested: greater_or_equals, less, greater
     * - Ensures operators work correctly at exact boundaries
     */
    test("should handle boundary values correctly", async ({ page }) => {
      // Age boundaries
      await fillFormField(page, "Patient Age", "input", "64");
      await checkVisibility(page, "Senior Health Screening Required", false);

      await fillFormField(page, "Patient Age", "input", "65");
      await checkVisibility(page, "Senior Health Screening Required", true);

      await fillFormField(page, "Patient Age", "input", "18");
      await checkVisibility(page, "Pediatric Assessment Required", false);

      await fillFormField(page, "Patient Age", "input", "17");
      await checkVisibility(page, "Pediatric Assessment Required", true);

      // BP boundary
      await fillFormField(page, "Systolic Blood Pressure", "input", "140");
      await checkVisibility(
        page,
        "⚠️ Hypertension Alert - Please consult physician",
        false,
      );

      await fillFormField(page, "Systolic Blood Pressure", "input", "141");
      await checkVisibility(
        page,
        "⚠️ Hypertension Alert - Please consult physician",
        true,
      );

      const finalAge = "17";
      const finalBP = "141";

      await fillBaseFields(page, { age: finalAge });
      await submitAndVerify(page, [
        finalAge,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        finalBP,
      ]);
    });

    /**
     * Tests distinction between empty string and undefined
     * Coverage:
     * - exists operator behavior with empty vs undefined values
     * - Empty string: treated as non-existent (false)
     * - Whitespace string: treated as existing (true)
     * - Cleared field: treated as non-existent (false)
     */
    test("should handle empty string vs undefined", async ({ page }) => {
      await fillFormField(page, "Patient Name", "input", "");
      await checkVisibility(page, "Middle Name", false);

      await fillFormField(page, "Patient Name", "input", " ");
      await checkVisibility(page, "Middle Name", true);

      await clearFormField(page, "Patient Name");
      await checkVisibility(page, "Middle Name", false);

      await fillBaseFields(page);
      await submitAndVerify(page, [
        BASE_FORM_DATA.age,
        BASE_FORM_DATA.gender,
        BASE_FORM_DATA.smokingStatus,
        BASE_FORM_DATA.bmi,
      ]);
    });
  });

  test.describe("Form validation", () => {
    /**
     * Tests validation of conditionally shown required fields
     * Coverage:
     * - Required field validation when condition is met
     * - Error display for conditionally shown required fields
     * - Validates pregnancy question appears and requires answer
     */
    test("should validate conditionally enabled required fields", async ({
      page,
    }) => {
      await fillBaseFields(page, { gender: "female" });
      await checkVisibility(page, "Are you currently pregnant?", true);

      await page.getByRole("button", { name: /submit|save/i }).click();
      await expectQuestionnaireFieldError(page, "Are you currently pregnant?");
    });

    /**
     * Tests successful submission with all conditions met
     * Coverage:
     * - Multiple conditionally shown fields all filled correctly
     * - Complex form state: female + former smoker (multiple conditions)
     * - Validates complete form flow with multiple enable_when conditions
     */
    test("should allow submission with all visible fields filled", async ({
      page,
    }) => {
      const gender = "female";
      const smokingStatus = "former";
      const quitYears = "3";
      const bmi = "24.5";
      const isPregnant = "true";

      await fillFormField(page, "Patient Age", "input", BASE_FORM_DATA.age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "Years Since Quit Smoking", "input", quitYears);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);
      await fillFormField(
        page,
        "Are you currently pregnant?",
        "radio",
        isPregnant,
      );

      await submitAndVerify(page, [
        BASE_FORM_DATA.age,
        gender,
        smokingStatus,
        quitYears,
        bmi,
      ]);
    });
  });
});
