import { Page, expect } from "@playwright/test";

interface Organization {
  id: string;
  org_type: string;
  name: string;
}

interface OrganizationResponse {
  count: number;
  results: Organization[];
}

/**
 * Check if a questionnaire exists
 */
export async function checkQuestionnaireExists(
  page: Page,
  apiUrl: string,
  questionnaireSlug: string,
  accessToken: string,
): Promise<boolean> {
  const response = await page.request.get(
    `${apiUrl}/api/v1/questionnaire/${questionnaireSlug}/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.status() === 200;
}

/**
 * Get a questionnaire by slug
 */
export async function getQuestionnaire(
  page: Page,
  apiUrl: string,
  questionnaireSlug: string,
  accessToken: string,
): Promise<unknown> {
  const response = await page.request.get(
    `${apiUrl}/api/v1/questionnaire/${questionnaireSlug}/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (response.ok()) {
    return await response.json();
  }

  throw new Error(`Failed to get questionnaire: ${response.status()}`);
}

/**
 * Create a questionnaire
 */
export async function createQuestionnaire(
  page: Page,
  apiUrl: string,
  questionnaireData: unknown,
  accessToken: string,
): Promise<unknown> {
  const response = await page.request.post(`${apiUrl}/api/v1/questionnaire/`, {
    data: questionnaireData,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (response.ok()) {
    return await response.json();
  }

  const errorText = await response.text();
  throw new Error(
    `Failed to create questionnaire: ${response.status()} - ${errorText}`,
  );
}

/**
 * Update a questionnaire
 */
export async function updateQuestionnaire(
  page: Page,
  apiUrl: string,
  questionnaireSlug: string,
  questionnaireData: unknown,
  accessToken: string,
): Promise<unknown> {
  const response = await page.request.put(
    `${apiUrl}/api/v1/questionnaire/${questionnaireSlug}/`,
    {
      data: questionnaireData,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (response.ok()) {
    return await response.json();
  }

  const errorText = await response.text();
  throw new Error(
    `Failed to update questionnaire: ${response.status()} - ${errorText}`,
  );
}

/**
 * Delete a questionnaire
 */
export async function deleteQuestionnaire(
  page: Page,
  apiUrl: string,
  questionnaireSlug: string,
  accessToken: string,
): Promise<void> {
  const response = await page.request.delete(
    `${apiUrl}/api/v1/questionnaire/${questionnaireSlug}/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok()) {
    throw new Error(`Failed to delete questionnaire: ${response.status()}`);
  }
}

/**
 * List questionnaires
 */
export async function listQuestionnaires(
  page: Page,
  apiUrl: string,
  accessToken: string,
): Promise<unknown[]> {
  const response = await page.request.get(`${apiUrl}/api/v1/questionnaire/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (response.ok()) {
    const data = await response.json();
    return data.results || [];
  }

  throw new Error(`Failed to list questionnaires: ${response.status()}`);
}

/**
 * Fetch organization IDs
 */
export async function fetchOrganizationIds(
  page: Page,
  apiUrl: string,
  accessToken: string,
): Promise<string[]> {
  const response = await page.request.get(
    `${apiUrl}/api/v1/organization/?org_type=role`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status() === 200) {
    const data: OrganizationResponse = await response.json();
    return data.results.map((org) => org.id);
  }

  throw new Error(`Failed to fetch organizations: ${response.status()}`);
}

/**
 * Helper function to find input element within a question container
 * @param questionContainer - The question container locator
 * @returns The input locator (number or text input)
 */
async function findInputInContainer(
  questionContainer: ReturnType<Page["locator"]>,
) {
  const numberInput = questionContainer.locator('input[type="number"]').first();
  const textInput = questionContainer.locator('input[type="text"]').first();
  const inputCount = await numberInput.count();
  return inputCount > 0 ? numberInput : textInput;
}

/**
 * Helper function to interact with form fields by their label text
 * Supports radio buttons, text inputs, number inputs, textareas, and checkboxes
 */
export async function fillFormField(
  page: Page,
  labelText: string,
  action: "radio" | "input" | "textarea" | "checkbox",
  value: string,
) {
  // Find the label and navigate to its question container
  const labelLocator = page.getByText(labelText, { exact: true });
  await labelLocator.scrollIntoViewIfNeeded();

  if (action === "radio") {
    // For radio buttons, find the parent container and then the specific radio option
    const questionContainer = labelLocator.locator(
      "xpath=ancestor::div[contains(@id, 'question')]",
    );
    await questionContainer.locator(`label[for="${value}"]`).click();
  } else if (action === "input") {
    // For inputs, find the parent container
    const questionContainer = labelLocator.locator(
      "xpath=ancestor::div[contains(@id, 'question')]",
    );
    const input = await findInputInContainer(questionContainer);
    await input.scrollIntoViewIfNeeded();
    await input.fill(value);
  } else if (action === "textarea") {
    // For textareas
    const questionContainer = labelLocator.locator(
      "xpath=ancestor::div[contains(@class, 'space-y-1')]",
    );
    const textarea = questionContainer.locator(
      'textarea[data-slot="textarea"]',
    );
    await textarea.scrollIntoViewIfNeeded();
    await textarea.fill(value);
  } else if (action === "checkbox") {
    // For checkboxes/boolean fields
    const questionContainer = labelLocator.locator(
      "xpath=ancestor::div[contains(@id, 'question')]",
    );
    const checkbox = questionContainer.locator(`label[for="${value}"]`);
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
  }
}

/**
 * Helper function to check element visibility
 */
export async function checkVisibility(
  page: Page,
  labelText: string,
  shouldBeVisible: boolean,
) {
  const labelLocator = page.getByText(labelText, { exact: true });
  if (shouldBeVisible) {
    await expect(labelLocator).toBeVisible();
  } else {
    await expect(labelLocator).not.toBeVisible();
  }
}

/**
 * Helper function to get input element by label text
 */
export async function getInputByLabel(
  page: Page,
  labelText: string,
  inputType: "number" | "text" = "number",
) {
  const labelLocator = page.getByText(labelText, { exact: true });
  await labelLocator.scrollIntoViewIfNeeded();
  const questionContainer = labelLocator.locator(
    "xpath=ancestor::div[contains(@id, 'question')]",
  );
  return questionContainer.locator(`input[type="${inputType}"]`).first();
}

/**
 * Helper to clear a form field
 */
export async function clearFormField(page: Page, labelText: string) {
  const labelLocator = page.getByText(labelText, { exact: true });
  await labelLocator.scrollIntoViewIfNeeded();
  const questionContainer = labelLocator.locator(
    "xpath=ancestor::div[contains(@id, 'question')]",
  );
  const input = await findInputInContainer(questionContainer);
  await input.clear();
}

/**
 * Helper to submit form and verify navigation to encounter overview with expected values
 */
export async function submitAndVerify(page: Page, expectedValues: string[]) {
  await page.getByRole("button", { name: /submit|save/i }).click();

  await page
    .locator("li[data-sonner-toast]")
    .getByText(/submitted successfully/i)
    .waitFor({ state: "visible", timeout: 15000 });

  await page.waitForURL(/\/encounter\/[^/]+/, { timeout: 10000 });

  // Verify submitted values appear in overview
  for (const value of expectedValues) {
    const valueLocator = page.getByText(value, { exact: true }).first();
    await valueLocator.scrollIntoViewIfNeeded();
    await expect(valueLocator).toBeVisible({ timeout: 10000 });
  }
}
