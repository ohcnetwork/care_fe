import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.describe("Token Category Create - Permission Tests", () => {
  // Test data generators
  let tokenCategoryName: string;
  let shorthand: string;
  let resourceType: string;
  let facilityId: string;

  // Resource types available for token categories
  const resourceTypes = ["Practitioner", "Location", "Healthcare Service"];

  test.beforeEach(async () => {
    // Generate fresh test data
    tokenCategoryName = faker.company.name();
    shorthand = faker.string.alphanumeric(5).toUpperCase();
    resourceType = faker.helpers.arrayElement(resourceTypes);
    facilityId = getFacilityId();
  });

  test.describe("Admin Access", () => {
    // Use admin authenticated state
    test.use({ storageState: "tests/.auth/user.json" });

    test("Admin can view Add Token Category button and create token category", async ({
      page,
    }) => {
      // Step 1: Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);
      await page.waitForLoadState("networkidle");

      // Verify we're on the token category list page
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category/,
      );

      // Step 2: Verify Add Token Category button is visible
      const addButton = page.getByRole("button", {
        name: "Add Token Category",
      });
      await expect(addButton).toBeVisible();

      // Step 3: Click Add Token Category button
      await addButton.click();

      // Verify we're on the creation page
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category\/new/,
      );
      await expect(
        page.getByRole("heading", { name: "Create Token Category" }),
      ).toBeVisible();

      // Step 4: Create a new token category
      // Fill all mandatory fields
      await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);
      await page.getByRole("combobox", { name: "Resource Type" }).click();
      await page.getByRole("option", { name: resourceType }).click();
      await page.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);

      // Submit the form
      await page.getByRole("button", { name: "Create" }).click();

      // Wait for navigation back to list page
      await page.waitForURL(
        /\/facility\/[^/]+\/settings\/token_category(?!\/new)/,
      );

      // Step 5: Test search functionality
      // First, verify there are items in the table before searching
      await page.waitForLoadState("networkidle");
      const tableBody = page.locator("tbody");

      // Search for the created token category
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);

      // Wait for table to update with search results
      await expect(tableBody).toContainText(tokenCategoryName, {
        timeout: 5000,
      });

      // Verify search results contain the created token category
      await expect(tableBody).toContainText(tokenCategoryName);
      await expect(tableBody).toContainText(shorthand);
      await expect(tableBody).toContainText(resourceType);

      // Step 6: Verify search filters correctly by searching for non-existent item
      const nonExistentName = "NonExistentTokenCategory12345";
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(nonExistentName);

      // Verify no results found or table is empty
      const noResultsText = page.getByText(/No.*found|No products found/i);
      const hasNoResults = await noResultsText.isVisible().catch(() => false);

      if (hasNoResults) {
        // "No results" message is displayed
        await expect(noResultsText).toBeVisible();
      } else {
        // Or table body should not contain our created token category
        await expect(tableBody).not.toContainText(tokenCategoryName);
      }

      // Step 7: Clear search and verify all items are shown again
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .clear();

      // Search again for our created token category to verify it's back in the list
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);

      // Wait for table to show the token category again
      await expect(tableBody).toContainText(tokenCategoryName, {
        timeout: 5000,
      });

      // Verify our token category is visible again
      await expect(tableBody).toContainText(tokenCategoryName);
    });
  });

  test.describe("Nurse Access", () => {
    test.beforeEach(async ({ page }) => {
      // Login as nurse
      await page.goto("/login");
      await page.getByRole("textbox", { name: /username/i }).fill("nurse_2_0");
      await page.getByLabel(/password/i).fill("Coronasafe@123");
      await page.getByRole("button", { name: /login/i }).click();
      await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

      // Verify we're logged in as nurse
      await expect(
        page.getByRole("heading", { name: /^Hey .+/ }),
      ).toBeVisible();
    });

    test("Nurse cannot see Add Token Category button", async ({ page }) => {
      // Step 1: Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);
      await page.waitForLoadState("networkidle");

      // Step 2: Check if we have access to the page
      // If nurse has access to the page, verify Add Token Category button is NOT visible
      const pageAccessible = await page
        .getByText(/Token Category|token_category/i)
        .isVisible()
        .catch(() => false);

      if (pageAccessible) {
        // Verify we're on the token category list page
        await expect(page).toHaveURL(
          /\/facility\/[^/]+\/settings\/token_category/,
        );

        // Verify Add Token Category button is NOT visible
        const addButton = page.getByRole("button", {
          name: "Add Token Category",
        });
        await expect(addButton).not.toBeVisible();
      }
      // If page is not accessible, that's also valid for nurses (access denied)
    });
  });
});
