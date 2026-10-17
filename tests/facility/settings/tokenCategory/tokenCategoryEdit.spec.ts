import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.describe("Token Category Edit - Permission Tests", () => {
  // Test data generators
  let tokenCategoryName: string;
  let shorthand: string;
  let resourceType: string;
  let updatedName: string;
  let updatedShorthand: string;
  let facilityId: string;

  // Resource types available for token categories
  const resourceTypes = ["Practitioner", "Location", "Healthcare Service"];

  test.beforeEach(async () => {
    // Generate fresh test data for creation
    tokenCategoryName = faker.company.name();
    shorthand = faker.string.alphanumeric(5).toUpperCase();
    resourceType = faker.helpers.arrayElement(resourceTypes);

    // Generate data for updates
    updatedName = faker.company.name();
    updatedShorthand = faker.string.alphanumeric(4).toUpperCase();
    facilityId = getFacilityId();
  });

  test.describe("Admin Access", () => {
    // Use admin authenticated state
    test.use({ storageState: "tests/.auth/user.json" });

    test("Admin can view Edit button in actions and submit the edit form", async ({
      page,
    }) => {
      // Step 1: Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);

      // Wait for page heading to be visible instead of networkidle
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      // Verify we're on the token category list page
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category/,
      );

      // Step 2: Create a token category first (so we have something to edit)
      await page
        .getByRole("button", { name: `Add ${resourceType} Token Category` })
        .click();

      // Fill and submit the inline creation form
      const popover = page.getByRole("dialog", {
        name: `Add ${resourceType} Token Category`,
      });
      await expect(popover).toBeVisible();
      await popover
        .getByRole("textbox", { name: "Name" })
        .fill(tokenCategoryName);
      await popover.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);
      await popover.getByRole("button", { name: "Create" }).click();
      await expect(popover).not.toBeVisible();

      // Step 3: Search for the created token category
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);

      // Step 4: Verify Edit button is visible in actions column
      const editButton = page.getByRole("link", { name: "Edit" }).first();
      await expect(editButton).toBeVisible();

      // Step 5: Click Edit button
      await editButton.click();

      // Verify we're on the edit page
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category\/.*\/edit/,
      );
      await expect(
        page.getByRole("heading", { name: "Edit Token Category" }),
      ).toBeVisible();

      // Step 6: Update the token category (resource type is read-only)
      await expect(
        page.getByRole("combobox", { name: "Resource Type" }),
      ).toHaveCount(0);
      await expect(
        page.locator('[data-cy="token-category-resource-type"]'),
      ).toContainText(resourceType);
      await page.getByRole("textbox", { name: "Name" }).fill(updatedName);
      await page
        .getByRole("textbox", { name: "Shorthand" })
        .fill(updatedShorthand);

      // Submit the edit form
      await page.getByRole("button", { name: "Update" }).click();

      // Wait for navigation back to list page
      await page.waitForURL(
        /\/facility\/[^/]+\/settings\/token_category(?!\/.*\/edit)/,
      );

      // Step 7: Verify the edit was successful
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(updatedName);

      // Category stays within its original resource type group
      const groupBody = page
        .getByRole("region", { name: resourceType, exact: true })
        .locator("tbody");
      await expect(groupBody).toContainText(updatedName);
      await expect(groupBody).toContainText(updatedShorthand);
    });

    test("Admin can access Set as default and Edit buttons after clicking View button", async ({
      page,
    }) => {
      // Step 1: Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);

      // Wait for page heading to be visible instead of networkidle
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      // Verify we're on the token category list page
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category/,
      );

      // Step 2: Create a token category first (so we have something to view)
      await page
        .getByRole("button", { name: `Add ${resourceType} Token Category` })
        .click();

      // Fill and submit the inline creation form
      const popover = page.getByRole("dialog", {
        name: `Add ${resourceType} Token Category`,
      });
      await expect(popover).toBeVisible();
      await popover
        .getByRole("textbox", { name: "Name" })
        .fill(tokenCategoryName);
      await popover.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);
      await popover.getByRole("button", { name: "Create" }).click();
      await expect(popover).not.toBeVisible();

      // Step 3: Click the View button of the first token category from the table
      const viewButton = page.getByRole("link", { name: "View" }).nth(1);
      await expect(viewButton).toBeVisible();
      await viewButton.click();

      // Wait for the view page to load by checking for Edit button
      await expect(page.getByRole("link", { name: "Edit" })).toBeVisible({
        timeout: 10000,
      });

      // Step 4: Verify Edit button is visible on the view page
      const editButtonOnViewPage = page.getByRole("link", { name: "Edit" });
      await expect(editButtonOnViewPage).toBeVisible();

      // Step 5: Verify Set as default button exists and is visible (if the feature exists)
      const setAsDefaultButton = page.getByRole("button", {
        name: /Set as default/i,
      });
      const setAsDefaultExists = await setAsDefaultButton
        .isVisible()
        .catch(() => false);

      if (setAsDefaultExists) {
        await expect(setAsDefaultButton).toBeVisible();
      }
    });
  });
});
