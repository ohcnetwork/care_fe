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

    test("Admin can view Add Token Category button", async ({ page }) => {
      // Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);

      // Wait for page heading to be visible instead of networkidle
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      // Verify we're on the token category list page
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category/,
      );

      // Verify Add Token Category button is visible
      const addButton = page.getByRole("button", {
        name: "Add Token Category",
      });
      await expect(addButton).toBeVisible();
    });

    test("Admin can create a token category", async ({ page }) => {
      // Navigate directly to creation page
      await page.goto(`/facility/${facilityId}/settings/token_category/new`);

      // Wait for the creation page heading to be visible instead of networkidle
      await expect(
        page.getByRole("heading", { name: "Create Token Category" }),
      ).toBeVisible({ timeout: 10000 });

      // Verify we're on the creation page
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category\/new/,
      );
      await expect(
        page.getByRole("heading", { name: "Create Token Category" }),
      ).toBeVisible();

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

      // Verify the created token category appears in the list
      // Wait for table to be visible instead of networkidle
      const tableBody = page.locator("tbody");
      await expect(tableBody).toBeVisible({ timeout: 10000 });

      // Search for the created token category
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);

      // Verify search results contain the created token category
      await expect(tableBody).toContainText(tokenCategoryName);
      await expect(tableBody).toContainText(shorthand);
      await expect(tableBody).toContainText(resourceType);
    });

    test("Admin sees no results when searching for non-existent token category", async ({
      page,
    }) => {
      // Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);

      // Wait for page heading to be visible instead of networkidle
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible({ timeout: 10000 });

      const nonExistentName = "NonExistentTokenCategory12345";

      // Search for non-existent item
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(nonExistentName);

      // Verify no results found message is displayed
      const noResultsText = page.getByText("No products found");
      await expect(noResultsText).toBeVisible();
    });

    test("Admin sees validation errors when submitting empty form", async ({
      page,
    }) => {
      // Navigate directly to creation page
      await page.goto(`/facility/${facilityId}/settings/token_category/new`);

      // Wait for the creation page heading to be visible instead of networkidle
      await expect(
        page.getByRole("heading", { name: "Create Token Category" }),
      ).toBeVisible({ timeout: 10000 });

      // Verify we're on the creation page
      await expect(page).toHaveURL(
        /\/facility\/[^/]+\/settings\/token_category\/new/,
      );

      // Click Create button without filling any fields
      await page.getByRole("button", { name: "Create" }).click();

      // Verify error message for Name field
      const nameLabel = page.getByLabel("Name");
      const nameError = page
        .locator('[data-slot="form-item"]')
        .filter({ has: nameLabel })
        .getByText("This field is required");
      await expect(nameError).toBeVisible();

      // Verify error message for Shorthand field
      const shorthandLabel = page.getByLabel("Shorthand");
      const shorthandError = page
        .locator('[data-slot="form-item"]')
        .filter({ has: shorthandLabel })
        .getByText("This field is required");
      await expect(shorthandError).toBeVisible();

      // Verify Resource Type field exists (has default value so no error)
      const resourceTypeLabel = page.getByLabel("Resource Type");
      await expect(resourceTypeLabel).toBeVisible();
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

      // Wait for page to load by checking for either access denied message or page heading
      await Promise.race([
        page
          .getByText("Access Denied to Token Category")
          .waitFor({ timeout: 5000 })
          .catch(() => null),
        page
          .getByRole("heading", { name: "Token Categories" })
          .waitFor({ timeout: 5000 })
          .catch(() => null),
      ]);

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
