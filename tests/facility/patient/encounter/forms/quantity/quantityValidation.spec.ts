import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  fillStringField,
  submitAndExpectSuccess,
  submitForm,
  verifyLabelledValues,
  verifySubmittedValues,
} from "tests/helper/questionnaire";
import { selectFromValueSet } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

const QUESTIONNAIRE_SLUG = "quantity-validation-test";
const QUESTION_LABEL = "Optional dose";
const QUANTITY_ERROR = "Type, Value and Unit are all required";
const QUANTITY_VALUE = "12.5";
const UNIT_SEARCH = "milligram";

test.describe("Questionnaire Quantity Validation", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test.beforeEach(async ({ page }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${QUESTIONNAIRE_SLUG}`,
    );
    await expect(page.getByText(QUESTION_LABEL, { exact: true })).toBeVisible();
  });

  test("allows an empty optional quantity response", async ({ page }) => {
    const patientName = faker.person.firstName();

    await test.step("Fill a different question so the backend accepts the form", async () => {
      await fillStringField(page, "Patient Name", patientName);
    });

    await test.step("Submit without filling the optional quantity", async () => {
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify the empty quantity is not rendered on the overview", async () => {
      await verifySubmittedValues(page, [], [QUESTION_LABEL]);
    });
  });

  test("rejects a partial optional quantity until the unit is added", async ({
    page,
  }) => {
    const patientName = faker.person.firstName();

    await test.step("Fill another question so the backend accepts a completed form", async () => {
      await fillStringField(page, "Patient Name", patientName);
    });

    await test.step("Enter only the numeric value", async () => {
      await fillQuantityValue(page, QUESTION_LABEL, QUANTITY_VALUE);
    });

    await test.step("Submit and verify the exact quantity validation error", async () => {
      await submitForm(page);
      await expect(getQuestionError(page, QUESTION_LABEL)).toContainText(
        QUANTITY_ERROR,
      );
      await expect(page).toHaveURL(
        new RegExp(`/questionnaire/${QUESTIONNAIRE_SLUG}$`),
      );
    });

    await test.step("Add the missing unit and submit successfully", async () => {
      await selectQuantityType(page, QUESTION_LABEL, "sublabial");
      await selectQuantityUnit(page, QUESTION_LABEL, UNIT_SEARCH);
      await submitAndExpectSuccess(page);
    });

    await test.step("Verify the submitted values are shown on the overview", async () => {
      await verifySubmittedValues(page, [patientName]);
      await verifyLabelledValues(page, [[QUESTION_LABEL, QUANTITY_VALUE]]);
    });
  });
});

function getQuestionContainer(page: Page, labelText: string): Locator {
  return page
    .getByText(labelText, { exact: true })
    .locator("xpath=ancestor::div[contains(@id, 'question-')]");
}

function getQuestionError(page: Page, labelText: string): Locator {
  return page
    .getByText(labelText, { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'space-y-2')]")
    .locator("p.text-red-500");
}

async function fillQuantityValue(page: Page, labelText: string, value: string) {
  const container = getQuestionContainer(page, labelText);
  const input = container.locator('input[type="number"]').first();
  await input.scrollIntoViewIfNeeded();
  await input.fill(value);
}

async function selectQuantityUnit(
  page: Page,
  labelText: string,
  search: string,
) {
  const container = getQuestionContainer(page, labelText);
  const unitTrigger = container.getByRole("combobox").nth(1);
  await selectFromValueSet(page, unitTrigger, { search, itemIndex: 0 });
}

async function selectQuantityType(
  page: Page,
  labelText: string,
  search: string,
) {
  const container = getQuestionContainer(page, labelText);
  const typeTrigger = container.getByRole("combobox").first();
  await selectFromValueSet(page, typeTrigger, { search, itemIndex: 0 });
}
