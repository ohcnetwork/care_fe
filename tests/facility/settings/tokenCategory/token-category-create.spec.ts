import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

test.describe("Token Category Create - Permission Tests", () => {
  // Test data generators
  let tokenCategoryName: string;
  let shorthand: string;
  let resourceType: string;

  // Resource types available for token categories
  const resourceTypes = ["Practitioner", "Location", "Healthcare Service"];

  test.beforeEach(async () => {
    // Generate fresh test data
    tokenCategoryName = faker.company.name();
    shorthand = faker.string.alphanumeric(5).toUpperCase();
    resourceType = faker.helpers.arrayElement(resourceTypes);
  });

  test.describe("Admin Access", () => {
    // Use admin authenticated state
    test.use({ storageState: "tests/.auth/user.json" });

    test("Admin can view Add Token Category button and create token category", async ({
      page,
    }) => {
      // Step 1: Start from the main page
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Step 2: Select the first facility card
      const firstFacilityCard = page
        .locator('a[href*="/facility/"][href$="/overview"]')
        .first();
      await expect(firstFacilityCard).toBeVisible();
      await firstFacilityCard.click();

      // Wait for navigation to facility page
      await page.waitForURL(/\/facility\/[^/]+/);

      // Step 3: Open toggle sidebar
      const sidebarToggle = page.getByRole("button", {
        name: "Toggle Sidebar",
      });
      await expect(sidebarToggle).toBeVisible();
      await sidebarToggle.click();

      // Step 4: Click on Settings section to expand it
      const settingsSection = page.getByRole("button", { name: "Settings" });
      await expect(settingsSection).toBeVisible();
      await settingsSection.click();

      // Step 5: Click on Token Category link
      const tokenCategoryLink = page.getByRole("link", {
        name: "Token Category",
      });
      await expect(tokenCategoryLink).toBeVisible();
      await tokenCategoryLink.click();

      // Verify we're on the token category list page
      await expect(page).toHaveURL(/\/settings\/token_category/);

      // Step 6: Verify Add Token Category button is visible
      const addButton = page.getByRole("button", {
        name: "Add Token Category",
      });
      await expect(addButton).toBeVisible();

      // Step 7: Click Add Token Category button
      await addButton.click();

      // Verify we're on the creation page
      await expect(page).toHaveURL(/\/settings\/token_category\/new/);
      await expect(
        page.getByRole("heading", { name: "Create Token Category" }),
      ).toBeVisible();

      // Step 8: Create a new token category
      // Fill all mandatory fields
      await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);
      await page.getByRole("combobox", { name: "Resource Type" }).click();
      await page.getByRole("option", { name: resourceType }).click();
      await page.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);

      // Submit the form
      await page.getByRole("button", { name: "Create" }).click();

      // Wait for navigation back to list page
      await page.waitForURL(/\/settings\/token_category(?!\/new)/);

      // Step 9: Test search functionality
      // First, verify there are items in the table before searching
      await page.waitForLoadState("networkidle");
      const tableBody = page.locator("tbody");

      // Search for the created token category
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);

      // Wait for search to filter results
      await page.waitForTimeout(500);

      // Verify search results contain the created token category
      await expect(tableBody).toContainText(tokenCategoryName);
      await expect(tableBody).toContainText(shorthand);
      await expect(tableBody).toContainText(resourceType);

      // Step 10: Verify search filters correctly by searching for non-existent item
      const nonExistentName = "NonExistentTokenCategory12345";
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(nonExistentName);

      // Wait for search to filter results
      await page.waitForTimeout(500);

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

      // Step 11: Clear search and verify all items are shown again
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .clear();

      // Wait for search to reset
      await page.waitForTimeout(500);

      // Search again for our created token category to verify it's back in the list
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);

      await page.waitForTimeout(500);

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
      // Step 1: Start from the main page
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Step 2: Select the first facility card
      const firstFacilityCard = page
        .locator('a[href*="/facility/"][href$="/overview"]')
        .first();
      await expect(firstFacilityCard).toBeVisible();
      await firstFacilityCard.click();

      // Wait for navigation to facility page
      await page.waitForURL(/\/facility\/[^/]+/);

      // Step 3: Open toggle sidebar
      const sidebarToggle = page.getByRole("button", {
        name: "Toggle Sidebar",
      });
      await expect(sidebarToggle).toBeVisible();
      await sidebarToggle.click();

      // Step 4: Check if Settings section exists
      const settingsSection = page.getByRole("button", { name: "Settings" });

      if (await settingsSection.isVisible()) {
        // If Settings exists, click it to expand
        await settingsSection.click();

        // Check if Token Category link is visible
        const tokenCategoryLink = page.getByRole("link", {
          name: "Token Category",
        });

        if (await tokenCategoryLink.isVisible()) {
          // If Token Category link exists, click it
          await tokenCategoryLink.click();

          // Verify we're on the token category list page
          await expect(page).toHaveURL(/\/settings\/token_category/);

          // Step 5: Verify Add Token Category button is NOT visible
          const addButton = page.getByRole("button", {
            name: "Add Token Category",
          });
          await expect(addButton).not.toBeVisible();
        }
        // If Token Category link is not visible, nurse doesn't have access to the page
      }
      // If Settings section doesn't exist, that's also valid for nurses
    });
  });
});
