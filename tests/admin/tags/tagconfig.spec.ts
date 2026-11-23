import { expect, test } from "@playwright/test";
import {
  addChildTagConfigViaUi,
  createTagConfigViaUi,
} from "tests/helper/admin";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Tag Configuration Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/tag_config");
  });

  test(
    "should create a new tag configuration",
    { tag: ["@atomic", "@cap:admin.tag.create"] },
    async ({ page }) => {
      // Generate a unique tag name to avoid conflicts
      const uniqueTagName = `Test Tag ${Date.now()}`;

      await createTagConfigViaUi(page, {
        name: uniqueTagName,
        category: "Admin",
        description: "Automated test tag description",
        organization: "Administrator",
      });

      // Verify the tag was created successfully
      await page
        .getByRole("textbox", { name: "Search tag configs" })
        .fill(uniqueTagName);
      await expect(
        page.getByRole("cell", { name: uniqueTagName }),
      ).toBeVisible();
    },
  );

  test(
    "should display existing tag configurations",
    { tag: ["@atomic", "@cap:admin.tag.list"] },
    async ({ page }) => {
      // Verify the tag config table is visible
      await expect(page.getByRole("table")).toBeVisible();

      // Verify table headers are present
      await expect(page.locator("thead")).toBeVisible();

      // Verify table body is present
      await expect(page.locator("tbody")).toBeVisible();
    },
  );

  test(
    "should validate required fields when creating tag config",
    { tag: ["@atomic", "@cap:admin.tag.create"] },
    async ({ page }) => {
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
    },
  );

  test(
    "should view tag details",
    { tag: ["@atomic", "@cap:admin.tag.view"] },
    async ({ page }) => {
      // Create a tag first
      const tagName = `View Test Tag ${Date.now()}`;
      await createTagConfigViaUi(page, {
        name: tagName,
        category: "Admin",
        description: "Test description",
        organization: "Administrator",
      });

      await page
        .getByRole("textbox", { name: "Search tag configs" })
        .fill(tagName);
      // View the tag details
      await page
        .getByRole("row", { name: tagName })
        .getByRole("button")
        .click();

      await expect(page.getByRole("heading", { name: tagName })).toBeVisible();
    },
  );

  test(
    "should create child tag",
    { tag: ["@atomic", "@cap:admin.tag.child.create"] },
    async ({ page }) => {
      // Create a parent tag first
      const parentTagName = `Parent ${Date.now()}`;
      const childTagName = `Child ${Date.now()}`;

      await createTagConfigViaUi(page, {
        name: parentTagName,
        category: "Admin",
        description: "Parent tag",
        organization: "Administrator",
      });

      // Navigate to parent tag and create child
      await addChildTagConfigViaUi(page, {
        parentName: parentTagName,
        name: childTagName,
      });

      // Verify child tag was created

      await expect(page.locator("tbody")).toContainText(childTagName);
      await page.getByRole("button", { name: "View" }).click();
      await expect(
        page.getByRole("heading", { name: childTagName }),
      ).toBeVisible();
    },
  );

  test(
    "should edit child tag with prefilled values",
    { tag: ["@atomic", "@cap:admin.tag.edit"] },
    async ({ page }) => {
      // Create parent and child tags first
      const parentTagName = `Edit Parent ${Date.now()}`;
      const childTagName = `Edit Child ${Date.now()}`;
      const updatedChildTagName = `Updated Child ${Date.now()}`;

      // Create parent tag
      await createTagConfigViaUi(page, {
        name: parentTagName,
        category: "Admin",
        description: "Parent for edit test",
        organization: "Administrator",
      });

      // Create child tag
      await addChildTagConfigViaUi(page, {
        parentName: parentTagName,
        name: childTagName,
      });

      // Navigate to view and edit the child tag
      await page.getByRole("button", { name: "View" }).click();
      await page.getByRole("button", { name: "Edit tag" }).click();

      // Verify form is prefilled with existing values
      const displayNameInput = page.getByRole("textbox", {
        name: "Display name *",
      });
      await expect(displayNameInput).toHaveValue(childTagName);

      // Update the child tag
      const displayNameField = page.getByRole("textbox", {
        name: "Display name *",
      });
      await displayNameField.click();
      await displayNameField.fill(updatedChildTagName);
      // Trigger change event by pressing Tab to ensure form validation runs
      await displayNameField.press("Tab");
      const updateButton = page.getByRole("button", {
        name: "Update tag config",
      });
      await expect(updateButton).toBeEnabled();
      await updateButton.click();

      // Verify the update was successful
      await page.getByRole("button", { name: "Back" }).click();
      await page.getByRole("button", { name: "Back" }).click();
      await page
        .getByRole("row", { name: parentTagName })
        .getByRole("button")
        .click();
      await expect(page.locator("tbody")).toContainText(updatedChildTagName);
    },
  );

  test(
    "should display child tags in hierarchy",
    { tag: ["@atomic", "@cap:admin.tag.view"] },
    async ({ page }) => {
      // Create parent and child for hierarchy test
      const parentTagName = `Hierarchy Parent ${Date.now()}`;
      const childTagName = `Hierarchy Child ${Date.now()}`;

      // Create parent tag
      await createTagConfigViaUi(page, {
        name: parentTagName,
        category: "Admin",
        description: "Hierarchy test parent",
        organization: "Administrator",
      });

      // Create child tag
      await addChildTagConfigViaUi(page, {
        parentName: parentTagName,
        name: childTagName,
      });

      // Verify child tag is properly categorized
      await page.getByRole("button", { name: "View" }).click();
      await page.getByRole("button", { name: parentTagName }).click();
      await expect(page.getByRole("cell", { name: /Child/i })).toBeVisible();
    },
  );

  test(
    "should display tag hierarchy correctly",
    {
      tag: ["@coupled", "@cap:admin.tag.view"],
      annotation: {
        type: "coupled",
        description:
          "Asserts only when an existing parent row is already visible; passes vacuously on environment data without one",
      },
    },
    async ({ page }) => {
      const parentRows = page
        .getByRole("row")
        .filter({ has: page.getByRole("button") });
      const firstParentRow = parentRows.first();

      if (await firstParentRow.isVisible()) {
        await firstParentRow.getByRole("button").click();
        await expect(page.getByRole("button", { name: "View" })).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Add child tag" }),
        ).toBeVisible();
        await page.getByRole("button", { name: "View" }).click();
        await expect(page.getByText("Child tags")).toBeVisible();
      }
    },
  );
});
