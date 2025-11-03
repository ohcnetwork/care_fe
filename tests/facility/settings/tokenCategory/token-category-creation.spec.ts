import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Token Category Creation", () => {
  let facilityId: string;

  // Resource types available for token categories (based on actual UI options)
  const resourceTypes = ["Practitioner", "Location", "Healthcare Service"];

  // Test data generators
  let tokenCategoryName: string;
  let shorthand: string;
  let resourceType: string;

  test.beforeEach(async ({ page }) => {
    // Get facility ID for each test run
    facilityId = getFacilityId();

    // Generate fresh test data for each test
    tokenCategoryName = faker.company.name();
    shorthand = faker.string.alphanumeric(5).toUpperCase();
    resourceType = faker.helpers.arrayElement(resourceTypes);

    // Navigate to token category creation page
    await page.goto(`/facility/${facilityId}/settings/token_category/new`);
  });

  test("Create a new token category with all mandatory fields", async ({
    page,
  }) => {
    // Fill all mandatory fields
    await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);

    await page.getByRole("combobox", { name: "Resource Type" }).click();
    await page.getByRole("option", { name: resourceType }).click();

    await page.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);

    // Submit the form and wait for navigation
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(
      new RegExp(`/facility/${facilityId}/settings/token_category`),
    );

    // Search for the created token category
    await page
      .getByRole("textbox", { name: "Search Token Categories" })
      .fill(tokenCategoryName);

    // Verify all data is correctly displayed in the list
    const tableBody = page.locator("tbody");
    await expect(tableBody).toContainText(tokenCategoryName);
    await expect(tableBody).toContainText(shorthand);
    await expect(tableBody).toContainText(resourceType);
  });

  test("Edit an existing token category and verify changes", async ({
    page,
  }) => {
    // Helper function to fill form fields
    const fillForm = async (name: string, type: string, sh: string) => {
      await page.getByRole("textbox", { name: "Name" }).fill(name);
      await page.getByRole("combobox", { name: "Resource Type" }).click();
      await page.getByRole("option", { name: type }).click();
      await page.getByRole("textbox", { name: "Shorthand" }).fill(sh);
    };

    // Create a token category first
    await fillForm(tokenCategoryName, resourceType, shorthand);
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForURL(
      new RegExp(`/facility/${facilityId}/settings/token_category`),
    );

    // Find and edit the created token category
    await page
      .getByRole("textbox", { name: "Search Token Categories" })
      .fill(tokenCategoryName);
    await page.getByRole("link", { name: "Edit" }).first().click();

    // Generate updated values
    const updatedName = faker.company.name();
    const updatedShorthand = faker.string.alphanumeric(4).toUpperCase();
    const updatedResourceType = faker.helpers.arrayElement(
      resourceTypes.filter((type) => type !== resourceType),
    );

    // Update all fields
    await fillForm(updatedName, updatedResourceType, updatedShorthand);
    await page.getByRole("button", { name: "Update" }).click();
    await page.waitForURL(
      new RegExp(`/facility/${facilityId}/settings/token_category`),
    );

    // Verify the changes
    await page
      .getByRole("textbox", { name: "Search Token Categories" })
      .fill(updatedName);

    const tableBody = page.locator("tbody");
    await expect(tableBody).toContainText(updatedName);
    await expect(tableBody).toContainText(updatedShorthand);
    await expect(tableBody).toContainText(updatedResourceType);
  });

  test("Validate form requires all mandatory fields", async ({ page }) => {
    const createButton = page.getByRole("button", { name: "Create" });

    // Test validation with empty form
    await createButton.click();
    await expect(
      page.locator("text=This field is required").first(),
    ).toBeVisible();

    // Test partial completion - only name filled
    await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);
    await createButton.click();
    await expect(page.locator("text=This field is required")).toBeVisible();

    // Complete all fields - form should be valid
    await page.getByRole("combobox", { name: "Resource Type" }).click();
    await page.getByRole("option", { name: resourceType }).click();
    await page.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);

    await expect(createButton).toBeEnabled();
  });

  test("Validate shorthand field length restrictions", async ({ page }) => {
    // Fill other required fields first
    await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);
    await page.getByRole("combobox", { name: "Resource Type" }).click();
    await page.getByRole("option", { name: resourceType }).click();

    // Test with shorthand that exceeds 5 character limit
    const longShorthand = faker.string.alphanumeric(6);
    await page.getByRole("textbox", { name: "Shorthand" }).fill(longShorthand);

    // Attempt to submit and verify validation error appears
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.locator("text=Maximum 5 characters are allowed"),
    ).toBeVisible();
  });

  test("Navigate back using cancel button", async ({ page }) => {
    // Fill some form fields first
    await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);

    // Click cancel button to navigate back
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify navigation to list page (URL may have query parameters)
    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/token_category`),
    );

    // Verify page elements are present
    await expect(
      page.getByRole("heading", { name: "Token Categories" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Token Category" }),
    ).toBeVisible();
  });

  test("Cancel token category creation", async ({ page }) => {
    // Fill some form fields
    await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);
    await page.getByRole("combobox", { name: "Resource Type" }).click();
    await page.getByRole("option", { name: resourceType }).click();

    // Click cancel button
    await page.getByRole("button", { name: "Cancel" }).click();

    // Verify navigation back to list page (URL may have query parameters)
    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/token_category`),
    );
  });

  test("Admin can access token category via sidebar navigation", async ({
    page,
  }) => {
    // Navigate to facility overview first
    await page.goto(`/facility/${facilityId}/overview`);

    // Click on sidebar toggle to ensure sidebar is visible/expanded
    const sidebarToggle = page.getByRole("button", { name: "Toggle Sidebar" });
    await sidebarToggle.click();

    // Navigate through Settings in sidebar to Token Categories
    // First click on Settings section to expand it
    const settingsSection = page.getByRole("button", { name: "Settings" });
    await settingsSection.click();

    // Wait for the Token Category link to become visible in the expanded submenu
    const tokenCategoryLink = page.getByRole("link", {
      name: "Token Category",
    });
    await tokenCategoryLink.waitFor({ state: "visible" });
    await tokenCategoryLink.click();

    // Verify navigation to token category list page
    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/token_category`),
    );

    // Verify page content is loaded correctly
    await expect(
      page.getByRole("heading", { name: "Token Categories" }),
    ).toBeVisible();
    await expect(page.getByText("Manage Token Categories")).toBeVisible();

    // Verify that admin can see the Add Token Category button (permission test)
    await expect(
      page.getByRole("button", { name: "Add Token Category" }),
    ).toBeVisible();

    // Verify the search functionality is available
    await expect(
      page.getByRole("textbox", { name: "Search Token Categories" }),
    ).toBeVisible();

    // Verify table headers are displayed correctly
    await expect(page.getByRole("cell", { name: "Name" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Resource Type" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Shorthand" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Actions" })).toBeVisible();
  });
});
