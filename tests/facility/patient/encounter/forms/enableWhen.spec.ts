import { test } from "@playwright/test";
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
    test("should show middle name field when patient name is filled", async ({
      page,
    }) => {
      const firstName = "John";
      const middleName = "Michael";
      const age = "30";
      const gender = "male";
      const smokingStatus = "never";
      const bmi = "24";

      // Middle name should be hidden initially
      await checkVisibility(page, "Middle Name", false);

      // Fill patient name
      await fillFormField(page, "Patient Name", "input", firstName);

      // Middle name should now be visible
      await checkVisibility(page, "Middle Name", true);

      // Fill middle name
      await fillFormField(page, "Middle Name", "input", middleName);

      // Fill required fields
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [
        firstName,
        middleName,
        age,
        gender,
        smokingStatus,
        bmi,
      ]);
    });

    test("should hide middle name field when patient name is cleared", async ({
      page,
    }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "never";
      const bmi = "23";

      // Fill patient name
      await fillFormField(page, "Patient Name", "input", "John");
      await checkVisibility(page, "Middle Name", true);

      // Clear patient name
      await clearFormField(page, "Patient Name");

      // Middle name should be hidden
      await checkVisibility(page, "Middle Name", false);

      // Fill required fields and submit without middle name
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
      // Patient name is not shown in overview since it wasn't filled
    });

    test("should not require hidden middle name field for submission", async ({
      page,
    }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "never";
      const bmi = "24";

      // Fill only required base fields (no patient name, so middle name stays hidden)
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });
  });

  test.describe("Choice 'equals' operator", () => {
    test("should show pregnancy question only for female gender", async ({
      page,
    }) => {
      const age = "30";
      const gender = "other";
      const smokingStatus = "never";
      const bmi = "23";

      // Pregnancy question should be hidden initially
      await checkVisibility(page, "Are you currently pregnant?", false);

      // Select male - should stay hidden
      await fillFormField(page, "Gender", "radio", "male");
      await checkVisibility(page, "Are you currently pregnant?", false);

      // Select female - should show
      await fillFormField(page, "Gender", "radio", "female");
      await checkVisibility(page, "Are you currently pregnant?", true);

      // Select other - should hide again
      await fillFormField(page, "Gender", "radio", gender);
      await checkVisibility(page, "Are you currently pregnant?", false);

      // Fill required fields and submit with other gender
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });

    test("should show quit years for former smokers", async ({ page }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "current";
      const bmi = "24";

      await checkVisibility(page, "Years Since Quit Smoking", false);

      // Select never smoker - should stay hidden
      await fillFormField(page, "Smoking Status", "radio", "never");
      await checkVisibility(page, "Years Since Quit Smoking", false);

      // Select former smoker - should show
      await fillFormField(page, "Smoking Status", "radio", "former");
      await checkVisibility(page, "Years Since Quit Smoking", true);

      // Select current smoker - should hide
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await checkVisibility(page, "Years Since Quit Smoking", false);

      // Fill required fields and submit with current smoker
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });

    test("should show cessation counseling for current smokers", async ({
      page,
    }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "former";
      const quitYears = "2";
      const bmi = "24.5";

      await checkVisibility(
        page,
        "Would you like smoking cessation counseling?",
        false,
      );

      // Select current smoker - should show
      await fillFormField(page, "Smoking Status", "radio", "current");
      await checkVisibility(
        page,
        "Would you like smoking cessation counseling?",
        true,
      );

      // Change to former - should hide
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await checkVisibility(
        page,
        "Would you like smoking cessation counseling?",
        false,
      );

      // Fill quit years (now visible), age, gender, BMI and submit
      await fillFormField(page, "Years Since Quit Smoking", "input", quitYears);
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, quitYears, bmi]);
    });
  });

  test.describe("Integer 'greater_or_equals' operator", () => {
    test("should show senior screening for age 65 and above", async ({
      page,
    }) => {
      const age = "70";
      const gender = "male";
      const smokingStatus = "never";

      await checkVisibility(page, "Senior Health Screening Required", false);

      // Age 64 - should not show senior screening, but BMI should be visible
      await fillFormField(page, "Patient Age", "input", "64");
      await checkVisibility(page, "Senior Health Screening Required", false);
      await fillFormField(page, "BMI (Body Mass Index)", "input", "23.0");

      // Age 65 - should show
      await fillFormField(page, "Patient Age", "input", "65");
      await checkVisibility(page, "Senior Health Screening Required", true);

      // Age 70 - should still show
      await fillFormField(page, "Patient Age", "input", age);
      await checkVisibility(page, "Senior Health Screening Required", true);

      // Fill remaining required fields and submit
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);

      await submitAndVerify(page, [age, gender, smokingStatus]);
    });
  });

  test.describe("Integer 'less' operator", () => {
    test("should show pediatric assessment for age under 18", async ({
      page,
    }) => {
      const age = "5";
      const gender = "male";
      const smokingStatus = "never";

      await checkVisibility(page, "Pediatric Assessment Required", false);

      // Age 17 - should show
      await fillFormField(page, "Patient Age", "input", "17");
      await checkVisibility(page, "Pediatric Assessment Required", true);

      // Age 18 - should not show pediatric, but BMI is now visible
      await fillFormField(page, "Patient Age", "input", "18");
      await checkVisibility(page, "Pediatric Assessment Required", false);
      await fillFormField(page, "BMI (Body Mass Index)", "input", "22.0");

      // Age 5 - should show pediatric, BMI hidden again (need to clear it)
      await fillFormField(page, "Patient Age", "input", age);
      await checkVisibility(page, "Pediatric Assessment Required", true);

      // Fill remaining required fields and submit
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);

      await submitAndVerify(page, [age, gender, smokingStatus]);
    });
  });

  test.describe("Integer 'greater' and 'less_or_equals' with 'all' behavior", () => {
    test("should show BMI only for ages 18-64", async ({ page }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "never";
      const bmi = "24.5";

      await checkVisibility(page, "BMI (Body Mass Index)", false);

      // Age 17 - should not show (not > 17)
      await fillFormField(page, "Patient Age", "input", "17");
      await checkVisibility(page, "BMI (Body Mass Index)", false);

      // Age 18 - should show (> 17 AND <= 64)
      await fillFormField(page, "Patient Age", "input", "18");
      await checkVisibility(page, "BMI (Body Mass Index)", true);

      // Age 30 - should show
      await fillFormField(page, "Patient Age", "input", age);
      await checkVisibility(page, "BMI (Body Mass Index)", true);

      // Age 64 - should show
      await fillFormField(page, "Patient Age", "input", "64");
      await checkVisibility(page, "BMI (Body Mass Index)", true);

      // Age 65 - should not show (not <= 64)
      await fillFormField(page, "Patient Age", "input", "65");
      await checkVisibility(page, "BMI (Body Mass Index)", false);

      // Set age back to 30, fill BMI and submit
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });

    test("should not require hidden BMI field for submission", async ({
      page,
    }) => {
      const age = "17";
      const gender = "male";
      const smokingStatus = "never";

      // Fill required fields with age 17 (BMI field hidden but required)
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);

      await submitAndVerify(page, [age, gender, smokingStatus]);
    });

    test("should require BMI field when visible (age 18-64)", async ({
      page,
    }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "never";

      // Fill required fields but skip BMI
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);

      // Verify BMI is visible
      await checkVisibility(page, "BMI (Body Mass Index)", true);

      // Try to submit without BMI
      await page.getByRole("button", { name: /submit|save/i }).click();

      // Should show validation error for BMI field
      await expectQuestionnaireFieldError(page, "BMI (Body Mass Index)");
    });
  });

  test.describe("Choice 'not_equals' with 'any' behavior", () => {
    test("should show high risk screening for age 50+ OR non-never smoker", async ({
      page,
    }) => {
      const age = "55";
      const gender = "male";
      const smokingStatus = "current";
      const bmi = "26.5";

      await checkVisibility(
        page,
        "High Risk Patient - Additional Screening Required",
        false,
      );

      // Age 49, never smoker - should not show (fails both conditions)
      await fillFormField(page, "Patient Age", "input", "49");
      await fillFormField(page, "Smoking Status", "radio", "never");
      await checkVisibility(
        page,
        "High Risk Patient - Additional Screening Required",
        false,
      );

      // Age 50, never smoker - should show (age condition met)
      await fillFormField(page, "Patient Age", "input", "50");
      await checkVisibility(
        page,
        "High Risk Patient - Additional Screening Required",
        true,
      );

      // Age 49, former smoker - should show (smoking condition met)
      await fillFormField(page, "Patient Age", "input", "49");
      await fillFormField(page, "Smoking Status", "radio", "former");
      await checkVisibility(
        page,
        "High Risk Patient - Additional Screening Required",
        true,
      );
      await fillFormField(page, "Years Since Quit Smoking", "input", "3");
      await fillFormField(page, "BMI (Body Mass Index)", "input", "25.0");

      // Age 55, current smoker - should show (both conditions met)
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await checkVisibility(
        page,
        "High Risk Patient - Additional Screening Required",
        true,
      );

      // Fill remaining required fields and submit
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });
  });

  test.describe("Integer 'exists' and 'greater' with 'all' behavior", () => {
    test("should show hypertension alert only when BP exists AND > 140", async ({
      page,
    }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "never";
      const bmi = "23.5";
      const hypertensionAlert =
        "⚠️ Hypertension Alert - Please consult physician";

      await checkVisibility(page, hypertensionAlert, false);

      // BP = 140 - should not show (not > 140)
      await fillFormField(page, "Systolic Blood Pressure", "input", "140");
      await checkVisibility(page, hypertensionAlert, false);
      // BP = 141 - should show (exists AND > 140)
      await fillFormField(page, "Systolic Blood Pressure", "input", "141");
      await checkVisibility(page, hypertensionAlert, true);

      // BP = 160 - should still show
      await fillFormField(page, "Systolic Blood Pressure", "input", "160");
      await checkVisibility(page, hypertensionAlert, true);

      // Fill required fields and submit without BP
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });
  });

  test.describe("String 'exists' operator for medication", () => {
    test("should show medication review when medications are entered", async ({
      page,
    }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "never";
      const bmi = "24";

      await checkVisibility(page, "Medication Review Required", false);

      // Enter medication - should show
      await fillFormField(
        page,
        "Currently on any medications?",
        "input",
        "Aspirin",
      );
      await checkVisibility(page, "Medication Review Required", true);

      // Clear medication - should hide
      await clearFormField(page, "Currently on any medications?");
      await checkVisibility(page, "Medication Review Required", false);

      // Fill required fields and submit without medication
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });
  });

  test.describe("Complex scenario - multiple hidden required fields", () => {
    test("should submit successfully when multiple required fields are hidden", async ({
      page,
    }) => {
      const age = "65";
      const gender = "male";
      const smokingStatus = "never";

      // Fill only base required fields
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);

      // Verify multiple required fields are hidden
      await checkVisibility(page, "Middle Name", false); // required but hidden
      await checkVisibility(page, "BMI (Body Mass Index)", false); // required but hidden
      await checkVisibility(page, "Are you currently pregnant?", false); // required but hidden
      await checkVisibility(page, "Years Since Quit Smoking", false); // required but hidden

      await submitAndVerify(page, [age, gender, smokingStatus]);
    });

    test("should show validation error for visible required field when hidden required fields are not filled", async ({
      page,
    }) => {
      const age = "30";
      const gender = "female";

      // Fill only age and gender, leaving smoking status empty (which is visible and required)
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      // Don't fill smoking status

      // Submit should fail with error for smoking status
      await page.getByRole("button", { name: /submit|save/i }).click();

      await expectQuestionnaireFieldError(page, "Smoking Status");
    });
  });

  test.describe("Dynamic visibility changes", () => {
    test("should handle rapid condition changes correctly", async ({
      page,
    }) => {
      const age = "30";
      const gender = "other";
      const smokingStatus = "never";
      const bmi = "23";

      // Rapidly change gender multiple times
      await fillFormField(page, "Gender", "radio", "female");
      await checkVisibility(page, "Are you currently pregnant?", true);

      await fillFormField(page, "Gender", "radio", "male");
      await checkVisibility(page, "Are you currently pregnant?", false);

      await fillFormField(page, "Gender", "radio", "female");
      await checkVisibility(page, "Are you currently pregnant?", true);

      await fillFormField(page, "Gender", "radio", gender);
      await checkVisibility(page, "Are you currently pregnant?", false);

      // Fill required fields and submit with other gender
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });
  });

  test.describe("Edge cases", () => {
    test("should handle boundary values correctly", async ({ page }) => {
      const age = "17";
      const gender = "male";
      const smokingStatus = "never";
      const bp = "141";

      // Test exact boundary for age >= 65
      await fillFormField(page, "Patient Age", "input", "64");
      await checkVisibility(page, "Senior Health Screening Required", false);

      await fillFormField(page, "Patient Age", "input", "65");
      await checkVisibility(page, "Senior Health Screening Required", true);

      // Test exact boundary for age < 18
      await fillFormField(page, "Patient Age", "input", "18");
      await checkVisibility(page, "Pediatric Assessment Required", false);

      await fillFormField(page, "Patient Age", "input", age);
      await checkVisibility(page, "Pediatric Assessment Required", true);

      // Test exact boundary for BP > 140
      await fillFormField(page, "Systolic Blood Pressure", "input", "140");
      await checkVisibility(
        page,
        "⚠️ Hypertension Alert - Please consult physician",
        false,
      );

      await fillFormField(page, "Systolic Blood Pressure", "input", bp);
      await checkVisibility(
        page,
        "⚠️ Hypertension Alert - Please consult physician",
        true,
      );

      // Fill remaining required fields and submit
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);

      await submitAndVerify(page, [age, gender, smokingStatus, bp]);
    });

    test("should handle empty string vs undefined for exists operator", async ({
      page,
    }) => {
      const age = "30";
      const gender = "male";
      const smokingStatus = "never";
      const bmi = "22.5";

      // Empty string should trigger 'exists' = false
      await fillFormField(page, "Patient Name", "input", "");
      await checkVisibility(page, "Middle Name", false);

      // Any value should trigger 'exists' = true
      await fillFormField(page, "Patient Name", "input", " ");
      await checkVisibility(page, "Middle Name", true);

      // Clear completely
      await clearFormField(page, "Patient Name");
      await checkVisibility(page, "Middle Name", false);

      // Fill required fields and submit without patient name
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      await submitAndVerify(page, [age, gender, smokingStatus, bmi]);
    });
  });

  test.describe("Form validation with enable_when", () => {
    test("should validate required enabled fields before submission", async ({
      page,
    }) => {
      const age = "30";
      const gender = "female";
      const smokingStatus = "never";
      const bmi = "23";

      // Fill base required fields including BMI (age 30)
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);

      // Pregnancy question is now visible and required, but not filled
      await checkVisibility(page, "Are you currently pregnant?", true);

      // Try to submit
      await page.getByRole("button", { name: /submit|save/i }).click();

      // Should show validation error
      await expectQuestionnaireFieldError(page, "Are you currently pregnant?");
    });

    test("should allow submission when all visible required fields are filled", async ({
      page,
    }) => {
      const age = "30";
      const gender = "female";
      const smokingStatus = "former";
      const quitYears = "3";
      const bmi = "24.5";

      // Fill all base required fields
      await fillFormField(page, "Patient Age", "input", age);
      await fillFormField(page, "Gender", "radio", gender);
      await fillFormField(page, "Smoking Status", "radio", smokingStatus);

      // Fill enabled required fields
      await fillFormField(page, "BMI (Body Mass Index)", "input", bmi);
      await fillFormField(
        page,
        "Are you currently pregnant?",
        "checkbox",
        "yes",
      );
      await fillFormField(page, "Years Since Quit Smoking", "input", quitYears);

      await submitAndVerify(page, [age, gender, smokingStatus, quitYears, bmi]);
    });
  });
});
