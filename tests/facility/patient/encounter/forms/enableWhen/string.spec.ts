import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  checkVisibility,
  clearStringField,
  expectFieldError,
  fillStringField,
  submitAndExpectSuccess,
  submitForm,
  verifySubmittedValues,
} from "tests/helper/questionnaire";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

const QUESTIONNAIRE_SLUG = "enable-when-test";

// Values that trigger (show) or keep safe (hide) dependent fields
const EQUALS_TRIGGER = "Doctor"; // equals "Doctor" → dependents show
const EQUALS_SAFE = "Engineer"; // not "Doctor" → dependents stay hidden
const NOT_EQUALS_TRIGGER = "Premium"; // ≠ "Standard" → dependents show
const NOT_EQUALS_SAFE = "Standard"; // = "Standard" → dependents stay hidden

test.describe("Enable When — String Operators", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${QUESTIONNAIRE_SLUG}`,
    );
    await expect(page.getByText("Patient Name", { exact: true })).toBeVisible();
  });

  // ──────────────────────────────────────────────
  // STRING 'exists' operator
  // Source: Patient Name → Dependents: Middle Name [required], Nickname [optional]
  // ──────────────────────────────────────────────

  test.describe("'exists' operator", () => {
    test("T1: source empty → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Dependent is hidden when source is empty", async () => {
        await checkVisibility(page, "Middle Name", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillStringField(page, "Professional Type", EQUALS_SAFE);
        await fillStringField(page, "Category", NOT_EQUALS_SAFE);
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [EQUALS_SAFE, NOT_EQUALS_SAFE]);
      });
    });

    test("T2: source empty → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Dependent is hidden when source is empty", async () => {
        await checkVisibility(page, "Nickname", false);
      });

      await test.step("Fill other sources with safe values and submit", async () => {
        await fillStringField(page, "Professional Type", EQUALS_SAFE);
        await fillStringField(page, "Category", NOT_EQUALS_SAFE);
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [EQUALS_SAFE, NOT_EQUALS_SAFE]);
      });
    });

    test("T3: source filled → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      const patientName = faker.person.firstName();

      await test.step("Fill source so dependent appears", async () => {
        await fillStringField(page, "Patient Name", patientName);
        await checkVisibility(page, "Middle Name", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Middle Name");
      });
    });

    test("T4: source filled → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const patientName = faker.person.firstName();
      const middleName = faker.person.middleName();

      await test.step("Fill source and required dependent", async () => {
        await fillStringField(page, "Patient Name", patientName);
        await checkVisibility(page, "Middle Name", true);
        await fillStringField(page, "Middle Name", middleName);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [patientName, middleName]);
      });
    });

    test("T5: source filled → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const patientName = faker.person.firstName();
      const middleName = faker.person.middleName();

      await test.step("Fill source so optional dependent appears", async () => {
        await fillStringField(page, "Patient Name", patientName);
        await checkVisibility(page, "Nickname", true);
      });

      await test.step("Fill required dependent but leave optional empty", async () => {
        await fillStringField(page, "Middle Name", middleName);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [patientName, middleName]);
      });
    });

    test("T6: source filled then cleared → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const patientName = faker.person.firstName();
      const middleName = faker.person.middleName();
      const nickname = faker.person.firstName();

      await test.step("Fill other sources with safe values", async () => {
        await fillStringField(page, "Professional Type", EQUALS_SAFE);
        await fillStringField(page, "Category", NOT_EQUALS_SAFE);
      });

      await test.step("Fill source — dependents appear", async () => {
        await fillStringField(page, "Patient Name", patientName);
        await checkVisibility(page, "Middle Name", true);
        await checkVisibility(page, "Nickname", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Middle Name", middleName);
        await fillStringField(page, "Nickname", nickname);
      });

      await test.step("Clear source — dependents hide", async () => {
        await clearStringField(page, "Patient Name");
        await checkVisibility(page, "Middle Name", false);
        await checkVisibility(page, "Nickname", false);
      });

      await test.step("Submit and verify hidden values not on overview", async () => {
        await submitAndExpectSuccess(page);
        await verifySubmittedValues(
          page,
          [EQUALS_SAFE, NOT_EQUALS_SAFE],
          [middleName, nickname],
        );
      });
    });
  });

  // ──────────────────────────────────────────────
  // STRING 'equals' operator
  // Source: Professional Type → Dependents: Medical License Number [required], Specialization [optional]
  // Match value: "Doctor"
  // ──────────────────────────────────────────────

  test.describe("'equals' operator", () => {
    test("T1: source non-match → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Type non-matching value — dependent stays hidden", async () => {
        await fillStringField(page, "Professional Type", EQUALS_SAFE);
        await checkVisibility(page, "Medical License Number", false);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [EQUALS_SAFE]);
      });
    });

    test("T2: source non-match → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Type non-matching value — dependent stays hidden", async () => {
        await fillStringField(page, "Professional Type", EQUALS_SAFE);
        await checkVisibility(page, "Specialization", false);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [EQUALS_SAFE]);
      });
    });

    test("T3: source = match → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Type matching value — dependent appears", async () => {
        await fillStringField(page, "Professional Type", EQUALS_TRIGGER);
        await checkVisibility(page, "Medical License Number", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Medical License Number");
      });
    });

    test("T4: source = match → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const licenseNumber = faker.string.alphanumeric(8);

      await test.step("Type matching value and fill required dependent", async () => {
        await fillStringField(page, "Professional Type", EQUALS_TRIGGER);
        await checkVisibility(page, "Medical License Number", true);
        await fillStringField(page, "Medical License Number", licenseNumber);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [EQUALS_TRIGGER, licenseNumber]);
      });
    });

    test("T5: source = match → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const licenseNumber = faker.string.alphanumeric(8);

      await test.step("Type matching value — optional dependent appears", async () => {
        await fillStringField(page, "Professional Type", EQUALS_TRIGGER);
        await checkVisibility(page, "Specialization", true);
      });

      await test.step("Fill required dependent but leave optional empty", async () => {
        await fillStringField(page, "Medical License Number", licenseNumber);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [EQUALS_TRIGGER, licenseNumber]);
      });
    });

    test("T6: source match → non-match → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const licenseNumber = faker.string.alphanumeric(8);
      const specialization = faker.lorem.word();

      await test.step("Fill other sources with safe values", async () => {
        await fillStringField(page, "Category", NOT_EQUALS_SAFE);
      });

      await test.step("Type matching value — dependents appear", async () => {
        await fillStringField(page, "Professional Type", EQUALS_TRIGGER);
        await checkVisibility(page, "Medical License Number", true);
        await checkVisibility(page, "Specialization", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Medical License Number", licenseNumber);
        await fillStringField(page, "Specialization", specialization);
      });

      await test.step("Change to non-matching — dependents hide", async () => {
        await fillStringField(page, "Professional Type", EQUALS_SAFE);
        await checkVisibility(page, "Medical License Number", false);
        await checkVisibility(page, "Specialization", false);
      });

      await test.step("Submit and verify hidden values not on overview", async () => {
        await submitAndExpectSuccess(page);
        await verifySubmittedValues(
          page,
          [EQUALS_SAFE],
          [licenseNumber, specialization],
        );
      });
    });
  });

  // ──────────────────────────────────────────────
  // STRING 'not_equals' operator
  // Source: Category → Dependents: Specify Other Category [required], Category Notes [optional]
  // Match value: "Standard" (dependent shows when source ≠ "Standard")
  // ──────────────────────────────────────────────

  test.describe("'not_equals' operator", () => {
    test("T1: source = match → dependent hidden [required] → submits", async ({
      page,
    }) => {
      await test.step("Type matching value — dependent stays hidden", async () => {
        await fillStringField(page, "Category", NOT_EQUALS_SAFE);
        await checkVisibility(page, "Specify Other Category", false);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [NOT_EQUALS_SAFE]);
      });
    });

    test("T2: source = match → dependent hidden [optional] → submits", async ({
      page,
    }) => {
      await test.step("Type matching value — dependent stays hidden", async () => {
        await fillStringField(page, "Category", NOT_EQUALS_SAFE);
        await checkVisibility(page, "Category Notes", false);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [NOT_EQUALS_SAFE]);
      });
    });

    test("T3: source non-match → dependent visible [required] + empty → validation error", async ({
      page,
    }) => {
      await test.step("Type non-matching value — dependent appears", async () => {
        await fillStringField(page, "Category", NOT_EQUALS_TRIGGER);
        await checkVisibility(page, "Specify Other Category", true);
      });

      await test.step("Submit without filling required dependent", async () => {
        await submitForm(page);
        await expectFieldError(page, "Specify Other Category");
      });
    });

    test("T4: source non-match → dependent visible [required] + filled → submits", async ({
      page,
    }) => {
      const otherCategory = faker.lorem.word();

      await test.step("Type non-matching value and fill required dependent", async () => {
        await fillStringField(page, "Category", NOT_EQUALS_TRIGGER);
        await checkVisibility(page, "Specify Other Category", true);
        await fillStringField(page, "Specify Other Category", otherCategory);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [NOT_EQUALS_TRIGGER, otherCategory]);
      });
    });

    test("T5: source non-match → dependent visible [optional] + empty → submits", async ({
      page,
    }) => {
      const otherCategory = faker.lorem.word();

      await test.step("Type non-matching value — optional dependent appears", async () => {
        await fillStringField(page, "Category", NOT_EQUALS_TRIGGER);
        await checkVisibility(page, "Category Notes", true);
      });

      await test.step("Fill required dependent but leave optional empty", async () => {
        await fillStringField(page, "Specify Other Category", otherCategory);
      });

      await test.step("Form submits successfully", async () => {
        await submitAndExpectSuccess(page);
      });

      await test.step("Verify submitted values on overview", async () => {
        await verifySubmittedValues(page, [NOT_EQUALS_TRIGGER, otherCategory]);
      });
    });

    test("T6: source non-match → match → dependent hides → hidden data not on overview", async ({
      page,
    }) => {
      const otherCategory = faker.lorem.word();
      const categoryNotes = faker.lorem.sentence();

      await test.step("Type non-matching value — dependents appear", async () => {
        await fillStringField(page, "Category", NOT_EQUALS_TRIGGER);
        await checkVisibility(page, "Specify Other Category", true);
        await checkVisibility(page, "Category Notes", true);
      });

      await test.step("Fill dependents with data", async () => {
        await fillStringField(page, "Specify Other Category", otherCategory);
        await fillStringField(page, "Category Notes", categoryNotes);
      });

      await test.step("Change to matching value — dependents hide", async () => {
        await fillStringField(page, "Category", NOT_EQUALS_SAFE);
        await checkVisibility(page, "Specify Other Category", false);
        await checkVisibility(page, "Category Notes", false);
      });

      await test.step("Submit and verify hidden values not on overview", async () => {
        await submitAndExpectSuccess(page);
        await verifySubmittedValues(
          page,
          [NOT_EQUALS_SAFE],
          [otherCategory, categoryNotes],
        );
      });
    });
  });
});
