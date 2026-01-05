import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Gets the error message element for a form field.
 * Looks for the error message in the parent element's form-message slot.
 *
 * @param fieldLocator - The form field locator (textbox, combobox, etc.)
 * @returns Locator for the error message element
 *
 * @example
 * const titleField = page.getByRole("textbox", { name: "Title *" });
 * const errorMessage = getFieldErrorMessage(titleField);
 * await expect(errorMessage).toBeVisible();
 * await expect(errorMessage).toContainText("Required");
 */
export function getFieldErrorMessage(fieldLocator: Locator): Locator {
  return fieldLocator.locator("..").locator('[data-slot="form-message"]');
}

/**
 * Gets the error message element for a questionnaire field.
 * Looks for the error container that has both the field label and error message.
 *
 * @param page - The Playwright page object
 * @param fieldLabel - The field label text
 * @returns Locator for the error container element
 *
 * @example
 * const errorMessage = getQuestionnaireFieldError(page, "BMI (Body Mass Index)");
 * await expect(errorMessage).toBeVisible();
 */
export function getQuestionnaireFieldError(
  page: Page,
  fieldLabel: string,
): Locator {
  return page
    .locator("div.text-red-600")
    .filter({ hasText: "This field is required" })
    .locator("..")
    .filter({ hasText: fieldLabel });
}

/**
 * Helper to verify questionnaire field validation error.
 * Checks that an error container has both the field label and "This field is required" message.
 *
 * @param page - The Playwright page object
 * @param fieldLabel - The field label text
 *
 * @example
 * await expectQuestionnaireFieldError(page, "BMI (Body Mass Index)");
 */
export async function expectQuestionnaireFieldError(
  page: Page,
  fieldLabel: string,
) {
  const errorContainer = getQuestionnaireFieldError(page, fieldLabel);
  await expect(errorContainer).toBeVisible();
}
