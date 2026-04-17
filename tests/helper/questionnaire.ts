import { type Page, expect } from "@playwright/test";
import { expectToast } from "tests/helper/ui";

/**
 * Locates the question container div for a given label.
 * Questions render with id="question-{uuid}" on the wrapper div.
 */
function getQuestionContainer(page: Page, labelText: string) {
  return page
    .getByText(labelText, { exact: true })
    .locator("xpath=ancestor::div[contains(@id, 'question-')]");
}

/**
 * Fills a string (type="text") input field identified by its label.
 */
export async function fillStringField(
  page: Page,
  labelText: string,
  value: string,
) {
  const label = page.getByText(labelText, { exact: true });
  await label.scrollIntoViewIfNeeded();
  const container = getQuestionContainer(page, labelText);
  const input = container.locator('input[type="text"]').first();
  await input.fill(value);
}

/**
 * Clears a string input field identified by its label.
 */
export async function clearStringField(page: Page, labelText: string) {
  const label = page.getByText(labelText, { exact: true });
  await label.scrollIntoViewIfNeeded();
  const container = getQuestionContainer(page, labelText);
  const input = container.locator('input[type="text"]').first();
  await input.clear();
}

/**
 * Asserts whether a field label is visible or hidden.
 */
export async function checkVisibility(
  page: Page,
  labelText: string,
  shouldBeVisible: boolean,
) {
  const label = page.getByText(labelText, { exact: true });
  if (shouldBeVisible) {
    await expect(label).toBeVisible();
  } else {
    await expect(label).not.toBeVisible();
  }
}

/**
 * Clicks the Submit button on the questionnaire form.
 */
export async function submitForm(page: Page) {
  await page.getByRole("button", { name: "Submit", exact: true }).click();
}

/**
 * Asserts that a questionnaire field shows a validation error.
 * The error <p> is a sibling of the question container's parent wrapper.
 */
export async function expectFieldError(page: Page, labelText: string) {
  const wrapper = page
    .getByText(labelText, { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'space-y-2')]");
  await expect(wrapper.locator("p.text-red-500")).toBeVisible();
}

/**
 * Submits the form and waits for the success toast.
 */
export async function submitAndExpectSuccess(page: Page) {
  await submitForm(page);
  await expectToast(page, /questionnaire submitted successfully/i);
}

/**
 * After submission, waits for navigation to the encounter updates page,
 * then asserts that `expectedValues` are visible and `excludedValues` are
 * NOT visible anywhere on the page.
 */
export async function verifySubmittedValues(
  page: Page,
  expectedValues: string[],
  excludedValues: string[] = [],
) {
  await page.waitForURL(/\/encounter\/[^/]+\/updates/);
  await page.waitForLoadState("networkidle");

  for (const val of expectedValues) {
    const locator = page.getByText(val, { exact: true }).first();
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
  }

  for (const val of excludedValues) {
    await expect(page.getByText(val, { exact: true })).not.toBeVisible();
  }
}
