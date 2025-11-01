import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "../../../support/facilityId";
import { generateObservationDefinitionData } from "../../../support/observationDefinition";

// Reuse authenticated storage state
test.use({ storageState: "tests/.auth/user.json" });

async function navigateToObservationDefinitions(page: Page) {
  const facilityId = getFacilityId();
  await page.goto(`/facility/${facilityId}/settings/observation_definitions`);
  return facilityId;
}

async function openCreateForm(page: Page, facilityId: string) {
  await page.goto(`/facility/${facilityId}/settings/observation_definitions`);
  await page.getByRole("button", { name: /add definition/i }).click();
  await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();
}

async function fillMandatoryFields(
  page: Page,
  data: ReturnType<typeof generateObservationDefinitionData>,
) {
  await page.locator('input[name="title"]').fill(data.title);
  await page.locator('input[name="slug_value"]').fill(data.slug);
  await page.locator('textarea[name="description"]').fill(data.description);

  // Category select
  await page.getByLabel(/category/i).click();
  await page
    .getByRole("option", { name: new RegExp(data.category, "i") })
    .click();

  // Data Type select
  await page.getByLabel(/data type/i).click();
  await page
    .getByRole("option", { name: new RegExp(data.dataType, "i") })
    .click();

  // Status select
  await page.getByLabel(/status/i).click();
  await page
    .getByRole("option", { name: new RegExp(data.status, "i") })
    .click();

  // LOINC Code select / typeahead
  const loincInput = page.getByLabel(/loinc code/i);
  await loincInput.click();
  await loincInput.fill(data.loincCode);
  // If a dropdown appears, select matching option; ignore if not present
  const candidate = page.getByRole("option", {
    name: new RegExp(data.loincCode, "i"),
  });
  if (await candidate.first().isVisible()) {
    await candidate.first().click();
  }
}

// Helper to assert notification by text
async function expectToast(page: Page, text: RegExp | string) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 10000 });
}

// Extract slug from detail page URL
function extractSlug(url: string): string | null {
  const m = url.match(/observation_definitions\/(.+)$/);
  return m ? m[1].split(/[?#]/)[0] : null;
}

// Tests

test.describe("Observation Definition Workflow", () => {
  test("should show validation errors for empty create form", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    await openCreateForm(page, facilityId);

    // Submit without filling
    await page.getByRole("button", { name: /create/i }).click();

    // Wait for error messages to appear
    await expect(page.getByText(/required/i).first()).toBeVisible();

    // Verify that form has not navigated away (still on create page)
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();
  });

  test("should create, filter, view and update an observation definition", async ({
    page,
  }) => {
    const facilityId = await navigateToObservationDefinitions(page);
    await page.getByRole("button", { name: /add definition/i }).click();

    const data = generateObservationDefinitionData();
    await fillMandatoryFields(page, data);

    await page.getByRole("button", { name: /create/i }).click();
    await expectToast(page, /observation definition created/i);

    // Filter by Status
    await page.getByRole("button", { name: /status/i }).click();
    await page
      .getByRole("option", { name: new RegExp(data.status, "i") })
      .click();

    // Search by title
    const searchBox = page.getByPlaceholder(/search definitions/i);
    await searchBox.fill(data.title);
    await expect(
      page.getByRole("row", { name: new RegExp(data.title, "i") }),
    ).toBeVisible();

    // Open details (Assuming a link or button with 'See Details')
    await page
      .getByRole("button", { name: /see details/i })
      .first()
      .click({ timeout: 10000 });

    // Verify details present
    await expect(page.getByText(data.description)).toBeVisible();
    await expect(page.getByText(data.loincCode)).toBeVisible();
    await expect(page.getByText(new RegExp(data.category, "i"))).toBeVisible();
    await expect(page.getByText(new RegExp(data.status, "i"))).toBeVisible();

    // Capture slug from URL for later navigation
    const currentUrl = page.url();
    const createdSlug = extractSlug(currentUrl);
    expect(createdSlug).toBeTruthy();

    // Edit flow
    await page.getByRole("button", { name: /edit/i }).click();

    const updatedTitle = `${data.title} Updated`;
    const updatedDescription = `${data.description} (modified)`;

    await page.locator('input[name="title"]').fill(updatedTitle);
    await page.locator('textarea[name="description"]').fill(updatedDescription);

    // Submit update (Looking for Save or Update button)
    const updateButton = page.getByRole("button", { name: /save|update/i });
    await updateButton.click();
    await expectToast(page, /observation definition updated/i);

    // Confirm we are redirected to view page with updated content
    await expect(page.getByText(updatedTitle)).toBeVisible();
    await expect(page.getByText(updatedDescription)).toBeVisible();
  });
});
