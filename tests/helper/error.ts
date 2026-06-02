import { expect, type Locator } from "@playwright/test";

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
 * Fills the given required text fields with whitespace-only input, submits the
 * form, and asserts each field shows its required-field error — i.e. that the
 * schema trims the value before the `.min(1)` check.
 *
 * @param fields - Required free-text field locators (textboxes/textareas)
 * @param submit - Action that submits the form (e.g. clicking Create/Save)
 *
 * @example
 * await expectWhitespaceRejected(
 *   [page.getByRole("textbox", { name: "Title *" })],
 *   () => page.getByRole("button", { name: "Create" }).click(),
 * );
 */
export async function expectWhitespaceRejected(
  fields: Locator[],
  submit: () => Promise<void>,
): Promise<void> {
  for (const field of fields) {
    await field.fill("   ");
  }
  await submit();
  for (const field of fields) {
    await expect(getFieldErrorMessage(field)).toBeVisible();
  }
}
