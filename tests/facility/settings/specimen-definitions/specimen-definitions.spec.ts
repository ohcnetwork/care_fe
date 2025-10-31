import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

const MIN_SLUG_LENGTH = 5;
const MAX_SLUG_LENGTH = 25;
const STATUS_OPTIONS = ["Draft", "Active", "Retired"] as const;
const DELETED_STATUS = "Retired";

// Helper function to get field error message
function getFieldErrorMessage(fieldLocator: Locator): Locator {
  return fieldLocator.locator("..").locator('[data-slot="form-message"]');
}

// Helper function to create a specimen definition
async function createSpecimenDefinition(
  page: Page,
  options: {
    title: string;
    slug: string;
    description: string;
    status: string;
  },
) {
  const { title, slug, description, status } = options;

  // Click Add Definition button
  await page.getByRole("button", { name: "Add Definition" }).click();

  // Fill required fields - Title
  await page.getByRole("textbox", { name: "Title *" }).fill(title);

  // Fill required fields - Slug
  await page.getByRole("textbox", { name: "Slug *" }).fill(slug);

  // Fill required fields - Description
  await page.getByRole("textbox", { name: "Description *" }).fill(description);

  // Select status (required field)
  await page.getByRole("combobox", { name: "Status *" }).click();
  await page.getByRole("option", { name: status }).click();

  // Select Type Collected (required field)
  await page.getByRole("combobox", { name: "Type Collected *" }).click();

  // Get first 5 options and randomly select one
  await page.getByRole("option").first().waitFor({ state: "visible" });
  const typeOptions = await page.getByRole("option").all();
  const randomOption = faker.helpers.arrayElement(typeOptions);
  await randomOption.click();

  // Get the selected type text for verification
  const selectedType = (await randomOption.textContent())!;

  // Submit form
  await page.getByRole("button", { name: /save/i }).click();

  return { selectedType };
}

test.describe("Specimen Definitions Management", () => {
  let facilityId: string;

  // Faker data - generated fresh for each test
  let definitionTitle: string;
  let definitionDescription: string;
  let definitionSlug: string;

  // Common navigation before each test
  test.beforeEach(async ({ page }) => {
    // Get facility ID for each test run
    facilityId = getFacilityId();

    // Generate fresh faker values for each test
    definitionTitle = faker.science.chemicalElement().name;
    definitionDescription = faker.lorem.sentence();
    const randomHex = faker.string
      .hexadecimal({ length: MIN_SLUG_LENGTH, prefix: "" })
      .toLowerCase();
    definitionSlug = `${faker.science.chemicalElement().symbol.toLowerCase()}-${randomHex}`;

    // Navigate to specimen definitions list
    const targetUrl = `/facility/${facilityId}/settings/specimen_definitions`;
    await page.goto(targetUrl);
  });

  test("should create specimen definition with all required fields", async ({
    page,
  }) => {
    const status = faker.helpers.arrayElement(STATUS_OPTIONS);

    // Create a new specimen definition using helper
    const { selectedType } = await createSpecimenDefinition(page, {
      title: definitionTitle,
      slug: definitionSlug,
      description: definitionDescription,
      status: status,
    });

    // Apply status filter before searching
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: status.toLowerCase() }).click();

    // Search for the newly created definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    // Verify it appears in the list with correct data
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(definitionTitle);
    await expect(tableBody).toContainText(definitionDescription);
    await expect(tableBody).toContainText(status);

    // Navigate to View page to verify complete details
    await page.getByRole("link", { name: /view/i }).first().click();

    // Verify action buttons exist
    if (status !== DELETED_STATUS) {
      await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    }

    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();

    await expect(
      page.getByRole("heading", { name: definitionTitle }),
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(definitionDescription);
    await expect(page.locator("body")).toContainText(status);
    await expect(page.locator("body")).toContainText(selectedType);
  });

  test("should be able to edit specimen definition and verify changes in list", async ({
    page,
  }) => {
    const status = faker.helpers.arrayElement(STATUS_OPTIONS);

    // CREATE: First create a specimen definition to edit
    await createSpecimenDefinition(page, {
      title: definitionTitle,
      slug: definitionSlug,
      description: definitionDescription,
      status: status,
    });

    // Apply status filter to find our created definition
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: status.toLowerCase() }).click();

    // Search for our specific definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    // Wait for table to be loaded
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toBeVisible();

    // Click the view link for our specific definition
    await page.getByRole("link", { name: /view/i }).first().click();

    // Click Edit button on detail page
    await page.getByRole("button", { name: /edit/i }).click();

    // Generate new values for modification
    const updatedTitle = faker.science.chemicalElement().name;
    const updatedDescription = faker.lorem.sentence();

    // Modify the title
    await page.getByRole("textbox", { name: "Title *" }).fill(updatedTitle);

    // Modify the description
    await page
      .getByRole("textbox", {
        name: "Description *",
      })
      .fill(updatedDescription);

    // Save changes
    await page.getByRole("button", { name: /save/i }).click();

    // Verify the updated data is displayed on detail page
    await expect(page.locator("body")).toContainText(updatedTitle);
    await expect(page.locator("body")).toContainText(updatedDescription);

    // Navigate back to list
    await page.getByRole("button", { name: /back/i }).click();

    // Wait for table to be loaded
    await expect(tableBody).toBeVisible();

    // Apply status filter to find our updated definition

    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: status.toLowerCase() }).click();

    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(updatedTitle);

    // Verify changes are reflected in the filtered list
    await expect(tableBody).toContainText(updatedTitle);
    await expect(tableBody).toContainText(updatedDescription);
  });

  test("should show validation errors when trying to save without required fields", async ({
    page,
  }) => {
    // Click Add Definition button to open create form
    await page.getByRole("button", { name: "Add Definition" }).click();

    // Click save without filling any required fields
    await page.getByRole("button", { name: /save/i }).click();

    // Verify validation error messages are displayed for each required field
    // Check that each field has a "Required" error message below it

    // Title field validation error
    await expect(
      getFieldErrorMessage(page.getByRole("textbox", { name: "Title *" })),
    ).toBeVisible();

    // Slug field validation error
    await expect(
      getFieldErrorMessage(page.getByRole("textbox", { name: "Slug *" })),
    ).toBeVisible();

    // Description field validation error
    await expect(
      getFieldErrorMessage(
        page.getByRole("textbox", { name: "Description *" }),
      ),
    ).toBeVisible();

    // Type Collected field validation error
    await expect(
      getFieldErrorMessage(
        page.getByRole("combobox", { name: "Type Collected *" }),
      ),
    ).toBeVisible();
  });

  test("should be able to delete specimen definition", async ({ page }) => {
    // Exclude "Retired" since retired specimens cannot be deleted
    const status = faker.helpers.arrayElement(
      STATUS_OPTIONS.filter((s) => s !== DELETED_STATUS),
    );

    // CREATE: First create a specimen definition to delete
    await createSpecimenDefinition(page, {
      title: definitionTitle,
      slug: definitionSlug,
      description: definitionDescription,
      status: status,
    });

    // Apply status filter to find our created definition
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: status.toLowerCase() }).click();

    // Search for our specific definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    // Wait for table to be loaded
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toBeVisible();

    // Click the view link for our specific definition
    await page.getByRole("link", { name: /view/i }).first().click();

    // Click Delete button
    await page.getByRole("button", { name: /delete/i }).click();

    // Confirm deletion in the dialog
    await page.getByRole("button", { name: /confirm/i }).click();

    // Wait for table to be loaded
    await expect(tableBody).toBeVisible();

    // Filter by retired status
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: "retired" }).click();

    // Wait for filter to apply
    await expect(page).toHaveURL(/status=retired/);

    // Search for the deleted definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    // Verify the definition exists with retired status
    await expect(tableBody).toContainText(definitionTitle);
    await expect(tableBody).toContainText(/retired/i);
  });

  test("should auto-populate slug from title", async ({ page }) => {
    // Click Add Definition button
    await page.getByRole("button", { name: "Add Definition" }).click();

    // Fill only the title field
    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);

    // Blur the title field to trigger slug auto-population
    await page.getByRole("textbox", { name: "Title *" }).blur();

    // Get the slug field value
    const slugField = page.getByRole("textbox", { name: "Slug *" });
    const slugValue = await slugField.inputValue();

    // Verify slug is auto-populated and not empty
    expect(slugValue).toBeTruthy();
    expect(slugValue.length).toBeGreaterThan(0);

    // Verify slug is derived from title (lowercase, hyphenated)
    const expectedSlugPattern = definitionTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    expect(slugValue).toContain(expectedSlugPattern.substring(0, 10)); // Check first part matches
  });

  test("should validate slug length between 5 and 25 characters", async ({
    page,
  }) => {
    // Click Add Definition button
    await page.getByRole("button", { name: "Add Definition" }).click();

    // Fill required fields
    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);
    await page
      .getByRole("textbox", { name: "Description *" })
      .fill(definitionDescription);

    // Test: Slug too short (less than 5 characters)
    const shortSlug = faker.string.alphanumeric(MIN_SLUG_LENGTH - 1);
    await page.getByRole("textbox", { name: "Slug *" }).fill(shortSlug);

    // Select status
    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: "Draft" }).click();

    // Select Type Collected
    await page.getByRole("combobox", { name: "Type Collected *" }).click();
    await page.getByRole("option").first().click();

    // Try to submit
    await page.getByRole("button", { name: /save/i }).click();

    // Verify validation error appears in notifications region
    const notificationsRegion = page.getByRole("region", {
      name: "Notifications alt+T",
    });
    await expect(notificationsRegion.getByRole("listitem")).toBeVisible();
    await expect(notificationsRegion).toContainText(/slug/i);

    // Test: Slug too long (more than 25 characters)
    const longSlug = faker.string.alphanumeric(MAX_SLUG_LENGTH + 1);
    await page.getByRole("textbox", { name: "Slug *" }).fill(longSlug);

    // Try to submit
    await page.getByRole("button", { name: /save/i }).click();

    // Verify validation error appears in notifications region
    await expect(notificationsRegion.getByRole("listitem")).toBeVisible();
    await expect(notificationsRegion).toContainText(/slug/i);

    // Test: Valid slug (between 5 and 25 characters)
    const validSlug = faker.string.alphanumeric(
      faker.number.int({ min: MIN_SLUG_LENGTH, max: MAX_SLUG_LENGTH }),
    );
    await page.getByRole("textbox", { name: "Slug *" }).fill(validSlug);

    // Try to submit
    await page.getByRole("button", { name: /save/i }).click();

    // Verify submission succeeds - should be redirected away from create page
    await expect(page).not.toHaveURL(/\/new$/);
  });

  test("should create specimen definition with all fields", async ({
    page,
  }) => {
    const status = faker.helpers.arrayElement(STATUS_OPTIONS);

    // Click Add Definition button
    await page.getByRole("button", { name: "Add Definition" }).click();

    // Fill all required fields
    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);
    await page.getByRole("textbox", { name: "Slug *" }).fill(definitionSlug);
    await page
      .getByRole("textbox", { name: "Description *" })
      .fill(definitionDescription);

    // Select status
    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: status }).click();

    // Fill Derived From URI (optional)
    const derivedFromUri = faker.internet.url();
    await page
      .getByRole("textbox", { name: "Derived From URI" })
      .fill(derivedFromUri);

    // Select Type Collected
    await page.getByRole("combobox", { name: "Type Collected *" }).click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const typeOptions = await page.getByRole("option").all();
    const randomTypeOption = faker.helpers.arrayElement(typeOptions);
    await randomTypeOption.click();
    const selectedType = (await randomTypeOption.textContent())!;

    // Select Collection (optional)
    await page.getByRole("combobox", { name: "Collection" }).click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const collectionOptions = await page.getByRole("option").all();
    const randomCollectionOption =
      faker.helpers.arrayElement(collectionOptions);
    await randomCollectionOption.click();

    // Add Patient Preparation (optional)
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByRole("combobox", { name: "Patient Preparation" }).click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const preparationOptions = await page.getByRole("option").all();
    const randomPreparationOption =
      faker.helpers.arrayElement(preparationOptions);
    await randomPreparationOption.click();

    // Toggle switches
    await page.getByRole("switch", { name: "Is Derived" }).click();
    await page.getByRole("switch", { name: "Single Use" }).click();

    // Select Preference
    await page.getByRole("combobox", { name: "Preference" }).click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const preferenceOptions = await page.getByRole("option").all();
    const randomPreferenceOption =
      faker.helpers.arrayElement(preferenceOptions);
    await randomPreferenceOption.click();

    // Fill Retention Time
    const retentionTime = faker.number.int({ min: 1, max: 72 });
    await page
      .getByRole("textbox", { name: "Enter Retention Time" })
      .fill(retentionTime.toString());

    // Fill Requirement
    const requirement = faker.lorem.sentence();
    await page.getByRole("textbox", { name: "Requirement" }).fill(requirement);

    // Container Information
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill(faker.lorem.sentence());

    await page.getByRole("combobox", { name: "Cap" }).click();
    await page.getByRole("option").first().waitFor({ state: "visible" });
    const capOptions = await page.getByRole("option").all();
    const randomCapOption = faker.helpers.arrayElement(capOptions);
    await randomCapOption.click();

    const capacity = faker.number.int({ min: 10, max: 100 });
    await page
      .getByRole("textbox", { name: "Enter Capacity" })
      .fill(capacity.toString());

    const minimumVolume = faker.number.int({ min: 5, max: 50 });
    await page
      .getByRole("textbox", { name: "Enter Minimum Volume" })
      .fill(minimumVolume.toString());

    await page
      .getByRole("textbox", { name: "Preparation" })
      .fill(faker.lorem.sentence());

    // Submit form
    await page.getByRole("button", { name: /save/i }).click();

    // Apply status filter before searching
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();
    await page.getByRole("option", { name: status.toLowerCase() }).click();

    // Search for the newly created definition
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    // Verify it appears in the list
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(definitionTitle);
    await expect(tableBody).toContainText(definitionDescription);
    await expect(tableBody).toContainText(status);

    // Navigate to View page to verify all details
    await page.getByRole("link", { name: /view/i }).first().click();

    // Verify all fields on detail page
    await expect(
      page.getByRole("heading", { name: definitionTitle }),
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(definitionDescription);
    await expect(page.locator("body")).toContainText(status);
    await expect(page.locator("body")).toContainText(selectedType);
  });
});
