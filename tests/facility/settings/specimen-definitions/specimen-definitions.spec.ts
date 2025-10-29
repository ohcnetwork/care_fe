import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

const SLUG_LENGTH = 5;

test.describe("Specimen Definitions Management", () => {
  let facilityId: string;

  // Faker data
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
      .hexadecimal({ length: SLUG_LENGTH, prefix: "" })
      .toLowerCase();
    definitionSlug = `${faker.science.chemicalElement().symbol.toLowerCase()}-${randomHex}`;

    // Navigate to specimen definitions list
    const targetUrl = `/facility/${facilityId}/settings/specimen_definitions`;
    await page.goto(targetUrl);
  });

  test("should create specimen definition with all required fields", async ({
    page,
  }) => {
    // Click Add Definition button
    await page.getByRole("button", { name: "Add Definition" }).click();

    // Fill required fields - Title
    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);

    // Fill required fields - Slug (must be max 25 characters)
    await page.getByRole("textbox", { name: "Slug *" }).fill(definitionSlug);

    // Fill required fields - Description
    await page
      .getByRole("textbox", { name: "Description *" })
      .fill(definitionDescription);

    // Select status (required field)
    await page.getByRole("combobox", { name: "Status *" }).click();
    await page.getByRole("option", { name: "active" }).click();

    // Select Type Collected (required field)
    await page.getByRole("combobox", { name: "Type Collected *" }).click();
    await page.getByRole("option").first().click();

    // Submit form
    await page.getByRole("button", { name: /save/i }).click();

    // Verify it appears in the list with correct data
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toContainText(definitionTitle);
    await expect(tableBody).toContainText(definitionDescription);
    await expect(tableBody).toContainText(/active/i);
  });

  test("should be able to edit specimen definition and verify changes in list", async ({
    page,
  }) => {
    // Wait for table to be loaded
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toBeVisible();

    // Click the first view link
    await page.getByRole("link", { name: /view/i }).first().click();

    // Click Edit button on detail page
    await page.getByRole("button", { name: /edit/i }).click();

    //Modify the title
    await page.getByRole("textbox", { name: "Title *" }).fill(definitionTitle);

    // Modify the description
    await page
      .getByRole("textbox", {
        name: "Description *",
      })
      .fill(definitionDescription);

    // Save changes
    await page.getByRole("button", { name: /save/i }).click();

    // Verify the updated description is displayed on detail page
    await expect(page.locator("body")).toContainText(definitionTitle);
    await expect(page.locator("body")).toContainText(definitionDescription);
    // Navigate back to list
    await page.getByRole("button", { name: /back/i }).click();

    // Wait for table to be loaded
    const updatedTableBody = page.locator('[data-slot="table-body"]');
    await expect(updatedTableBody).toBeVisible();

    // Search for the updated definition to filter results
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(definitionTitle);

    // Verify changes are reflected in the filtered list
    await expect(updatedTableBody).toContainText(definitionTitle);
    await expect(updatedTableBody).toContainText(definitionDescription);
  });

  test("should be able to view specimen definition with complete details", async ({
    page,
  }) => {
    // Get the first definition's title and description for verification
    const firstTitle = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .first()
      .textContent();

    const firstDescription = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .nth(2)
      .textContent();

    // Click the first view link
    await page.getByRole("link", { name: /view/i }).first().click();

    // Verify the title is displayed on the detail page
    if (firstTitle) {
      await expect(page.locator("h1")).toContainText(firstTitle);
    }

    // Verify description is displayed
    if (firstDescription) {
      await expect(page.locator("body")).toContainText(firstDescription);
    }

    // Verify detail page action buttons exist
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /edit/i })).toBeVisible();

    // Verify status badge is visible
    await expect(page.getByText(/active|draft|retired/i).first()).toBeVisible();
  });

  test("should show validation errors when trying to save without required fields", async ({
    page,
  }) => {
    // Click Add Definition button to open create form
    await page.getByRole("button", { name: "Add Definition" }).click();

    // Click save without filling any required fields
    await page.getByRole("button", { name: /save/i }).click();

    // Verify validation error messages are displayed for all required fields
    // Each required field shows just "Required" as the error message
    const requiredErrors = page.getByText("Required");
    await expect(requiredErrors).toHaveCount(4); // Title, Slug, Description, Type Collected
  });

  test("should list specimen definitions", async ({ page }) => {
    // Verify table body exists and has rows
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toBeVisible();

    // Verify at least one row exists
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("should filter based on search", async ({ page }) => {
    // Get the first definition's title
    const firstTitle = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .first()
      .textContent();

    if (firstTitle) {
      // Find search textbox and search for the definition
      await page
        .getByRole("textbox", {
          name: "Search definitions",
        })
        .fill(firstTitle);

      // Verify filtered results contain the search term
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        firstTitle,
      );
    }
  });

  test("should filter based on status - draft", async ({ page }) => {
    // Wait for table to be loaded
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toBeVisible();

    // Click status filter combobox (it shows current filter: "Status is Active")
    await page.getByRole("combobox").filter({ hasText: "Status" }).click();

    // Select draft status
    await page.getByRole("option", { name: "draft" }).click();

    // Verify URL contains status parameter
    await expect(page).toHaveURL(/status=draft/);

    // Verify results show draft status badges (if any exist)
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();
    if (rowCount > 0) {
      await expect(tableBody).toContainText(/draft/i);
    }
  });

  test("should be able to delete specimen definition", async ({ page }) => {
    // Wait for table to be loaded
    const tableBody = page.locator('[data-slot="table-body"]');
    await expect(tableBody).toBeVisible();

    // Get the first definition's title for verification
    const firstTitle = await page
      .locator("tbody tr")
      .first()
      .locator("td")
      .first()
      .textContent();

    // Click the first view link to open detail page
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
    if (firstTitle) {
      await page
        .getByRole("textbox", { name: "Search definitions" })
        .fill(firstTitle);

      // Verify the definition exists with retired status
      await expect(tableBody).toContainText(firstTitle);
      await expect(tableBody).toContainText(/retired/i);
    }
  });
});
