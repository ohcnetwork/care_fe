import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Tag Configuration Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto("/");
    await page.getByRole("link", { name: "Admin Dashboard" }).click();

    // Navigate to Tag Config page
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("link", { name: "Tag Config" }).click();
  });

  test("should create a new tag configuration", async ({ page }) => {
    // Generate a unique tag name to avoid conflicts
    const uniqueTagName = `Test Tag ${Date.now()}`;

    // Start creating a new tag config
    await page.getByRole("button", { name: "Add tag config" }).click();

    // Fill in the tag details
    await page
      .getByRole("textbox", { name: "Display name *" })
      .fill(uniqueTagName);

    // Select category
    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Admin" }).click();

    // Add description
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Automated test tag description");

    // Select organization
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Organization" })
      .click();
    await page.getByRole("option", { name: "Administrator" }).click();

    // Create the tag config
    await page.getByRole("button", { name: "Create tag config" }).click();

    // Verify the tag was created successfully
    await expect(page.locator("tbody")).toContainText(uniqueTagName);
    await expect(
      page.getByRole("cell", { name: new RegExp(uniqueTagName) }),
    ).toBeVisible();
  });

  test("should display existing tag configurations", async ({ page }) => {
    // Verify the tag config table is visible
    await expect(page.locator(".rounded-md.overflow-x-auto")).toBeVisible();

    // Verify table headers are present (adjust based on actual table structure)
    await expect(page.locator("thead")).toBeVisible();

    // Verify table body is present
    await expect(page.locator("tbody")).toBeVisible();
  });

  test("should validate required fields when creating tag config", async ({
    page,
  }) => {
    // Start creating a new tag config
    await page.getByRole("button", { name: "Add tag config" }).click();
    // Add description
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Automated test tag description");
    // Try to submit without required fields
    await page.getByRole("button", { name: "Create tag config" }).click();
    // Verify validation errors appear (adjust selectors based on actual error display)
    // This assumes the form shows validation errors - adjust as needed
    await expect(
      page.getByRole("textbox", { name: "Display name *" }),
    ).toBeFocused();
  });

  test("should view tag details", async ({ page }) => {
    // Create a tag first
    const tagName = `View Test Tag ${Date.now()}`;
    await page.getByRole("button", { name: "Add tag config" }).click();
    await page.getByRole("textbox", { name: "Display name *" }).fill(tagName);
    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Admin" }).click();
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Test description");
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Organization" })
      .click();
    await page.getByRole("option", { name: "Administrator" }).click();
    await page.getByRole("button", { name: "Create tag config" }).click();

    // View the tag details
    await page.getByRole("row", { name: tagName }).getByRole("button").click();

    await expect(page.getByRole("heading", { name: tagName })).toBeVisible();
  });

  test("should create child tag", async ({ page }) => {
    // Create a parent tag first
    const parentTagName = `Parent ${Date.now()}`;
    const childTagName = `Child ${Date.now()}`;

    await page.getByRole("button", { name: "Add tag config" }).click();
    await page
      .getByRole("textbox", { name: "Display name *" })
      .fill(parentTagName);
    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Admin" }).click();
    await page.getByRole("textbox", { name: "Description" }).fill("Parent tag");
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Organization" })
      .click();
    await page.getByRole("option", { name: "Administrator" }).click();
    await page.getByRole("button", { name: "Create tag config" }).click();

    // Navigate to parent tag and create child
    await page
      .getByRole("row", { name: parentTagName })
      .getByRole("button")
      .click();
    await page.getByRole("button", { name: "Add child tag" }).click();
    await page
      .getByRole("textbox", { name: "Display name *" })
      .fill(childTagName);
    await page.getByRole("button", { name: "Create tag config" }).click();

    // Verify child tag was created

    await expect(page.locator("tbody")).toContainText(childTagName);
    await page.getByRole("button", { name: "View" }).click();
    await expect(
      page.getByRole("heading", { name: childTagName }),
    ).toBeVisible();
  });

  test("should edit child tag with prefilled values", async ({ page }) => {
    // Create parent and child tags first
    const parentTagName = `Edit Parent ${Date.now()}`;
    const childTagName = `Edit Child ${Date.now()}`;
    const updatedChildTagName = `Updated Child ${Date.now()}`;

    // Create parent tag
    await page.getByRole("button", { name: "Add tag config" }).click();
    await page
      .getByRole("textbox", { name: "Display name *" })
      .fill(parentTagName);
    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Admin" }).click();
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Parent for edit test");
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Organization" })
      .click();
    await page.getByRole("option", { name: "Administrator" }).click();
    await page.getByRole("button", { name: "Create tag config" }).click();

    // Create child tag
    await page
      .getByRole("row", { name: parentTagName })
      .getByRole("button")
      .click();
    await page.getByRole("button", { name: "Add child tag" }).click();
    await page
      .getByRole("textbox", { name: "Display name *" })
      .fill(childTagName);
    await page.getByRole("button", { name: "Create tag config" }).click();

    // Navigate to view and edit the child tag
    await page.getByRole("button", { name: "View" }).click();
    await page.getByRole("button", { name: "Edit tag" }).click();

    // Verify form is prefilled with existing values
    const displayNameInput = page.getByRole("textbox", {
      name: "Display name *",
    });
    await expect(displayNameInput).toHaveValue(childTagName);

    // Update the child tag
    await displayNameInput.clear();
    await displayNameInput.fill(updatedChildTagName);
    await page.getByRole("button", { name: "Update tag config" }).click();

    // Verify the update was successful
    await page.getByRole("button", { name: "Back" }).click();
    await page
      .getByRole("row", { name: parentTagName })
      .getByRole("button")
      .click();
    await expect(page.locator("tbody")).toContainText(updatedChildTagName);
  });

  test("should display child tags in hierarchy", async ({ page }) => {
    // Create parent and child for hierarchy test
    const parentTagName = `Hierarchy Parent ${Date.now()}`;
    const childTagName = `Hierarchy Child ${Date.now()}`;

    // Create parent tag
    await page.getByRole("button", { name: "Add tag config" }).click();
    await page
      .getByRole("textbox", { name: "Display name *" })
      .fill(parentTagName);
    await page.getByRole("combobox", { name: "Category" }).click();
    await page.getByRole("option", { name: "Admin" }).click();
    await page
      .getByRole("textbox", { name: "Description" })
      .fill("Hierarchy test parent");
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Organization" })
      .click();
    await page.getByRole("option", { name: "Administrator" }).click();
    await page.getByRole("button", { name: "Create tag config" }).click();

    // Create child tag
    await page
      .getByRole("row", { name: parentTagName })
      .getByRole("button")
      .click();
    await page.getByRole("button", { name: "Add child tag" }).click();
    await page
      .getByRole("textbox", { name: "Display name *" })
      .fill(childTagName);
    await page.getByRole("button", { name: "Create tag config" }).click();

    // Verify child tag is properly categorized
    await page.getByRole("button", { name: "View" }).click();
    await page.getByRole("button", { name: parentTagName }).click();
    await expect(page.getByRole("cell", { name: /Child/i })).toBeVisible();
  });

  test("should display tag hierarchy correctly", async ({ page }) => {
    // This test verifies that parent-child relationships are displayed correctly
    // Look for any existing parent tags with children
    const parentRows = page
      .getByRole("row")
      .filter({ has: page.getByRole("button") });
    const firstParentRow = parentRows.first();

    if (await firstParentRow.isVisible()) {
      await firstParentRow.getByRole("button").click();

      // Verify the tag details view loads
      await expect(page.getByRole("button", { name: "View" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add child tag" }),
      ).toBeVisible();

      // Check if child tags section exists
      await page.getByRole("button", { name: "View" }).click();
      await expect(page.getByText("Child tags")).toBeVisible();
    }
  });
});
