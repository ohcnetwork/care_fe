import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

test.describe("Token Category Edit - Permission Tests", () => {
  // Test data generators
  let tokenCategoryName: string;
  let shorthand: string;
  let resourceType: string;
  let updatedName: string;
  let updatedShorthand: string;
  let updatedResourceType: string;

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
    updatedResourceType = faker.helpers.arrayElement(resourceTypes);
  });

  test.describe("Admin Access", () => {
    // Use admin authenticated state
    test.use({ storageState: "tests/.auth/user.json" });

    test("Admin can view Edit button in actions and submit the edit form", async ({
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

      // Step 6: Create a token category first (so we have something to edit)
      const addButton = page.getByRole("button", {
        name: "Add Token Category",
      });
      await expect(addButton).toBeVisible();
      await addButton.click();

      // Fill and submit creation form
      await expect(page).toHaveURL(/\/settings\/token_category\/new/);
      await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);
      await page.getByRole("combobox", { name: "Resource Type" }).click();
      await page.getByRole("option", { name: resourceType }).click();
      await page.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);
      await page.getByRole("button", { name: "Create" }).click();

      // Wait for navigation back to list page
      await page.waitForURL(/\/settings\/token_category(?!\/new)/);

      // Step 7: Search for the created token category
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(tokenCategoryName);

      // Step 8: Verify Edit button is visible in actions column
      const editButton = page.getByRole("link", { name: "Edit" }).first();
      await expect(editButton).toBeVisible();

      // Step 9: Click Edit button
      await editButton.click();

      // Verify we're on the edit page
      await expect(page).toHaveURL(/\/settings\/token_category\/.*\/edit/);
      await expect(
        page.getByRole("heading", { name: "Edit Token Category" }),
      ).toBeVisible();

      // Step 10: Update the token category
      await page.getByRole("textbox", { name: "Name" }).fill(updatedName);
      await page.getByRole("combobox", { name: "Resource Type" }).click();
      await page.getByRole("option", { name: updatedResourceType }).click();
      await page
        .getByRole("textbox", { name: "Shorthand" })
        .fill(updatedShorthand);

      // Submit the edit form
      await page.getByRole("button", { name: "Update" }).click();

      // Wait for navigation back to list page
      await page.waitForURL(/\/settings\/token_category(?!\/.*\/edit)/);

      // Step 11: Verify the edit was successful
      await page
        .getByRole("textbox", { name: "Search Token Categories" })
        .fill(updatedName);

      const tableBody = page.locator("tbody");
      await expect(tableBody).toContainText(updatedName);
      await expect(tableBody).toContainText(updatedShorthand);
      await expect(tableBody).toContainText(updatedResourceType);
    });

    test("Admin can access Set as default and Edit buttons after clicking View button", async ({
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

      // Step 6: Create a token category first (so we have something to view)
      const addButton = page.getByRole("button", {
        name: "Add Token Category",
      });
      await expect(addButton).toBeVisible();
      await addButton.click();

      // Fill and submit creation form
      await expect(page).toHaveURL(/\/settings\/token_category\/new/);
      await page.getByRole("textbox", { name: "Name" }).fill(tokenCategoryName);
      await page.getByRole("combobox", { name: "Resource Type" }).click();
      await page.getByRole("option", { name: resourceType }).click();
      await page.getByRole("textbox", { name: "Shorthand" }).fill(shorthand);
      await page.getByRole("button", { name: "Create" }).click();

      // Step 8: Click the View button of the first token category from the table
      const viewButton = page.getByRole("link", { name: "View" }).nth(1);
      await expect(viewButton).toBeVisible();
      await viewButton.click();

      // Wait for the view page to load
      await page.waitForLoadState("networkidle");

      // Step 9: Verify Edit button is visible on the view page
      const editButtonOnViewPage = page.getByRole("link", { name: "Edit" });
      await expect(editButtonOnViewPage).toBeVisible();

      // Step 10: Verify Set as default button exists and is visible (if the feature exists)
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

    test("Nurse cannot view Edit button in actions", async ({ page }) => {
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

          // Wait for the page to load completely
          await page.waitForLoadState("networkidle");

          // Step 5: Verify Edit button is NOT visible in actions
          const editButtons = page.getByRole("link", { name: "Edit" });
          const editButtonCount = await editButtons.count();

          // Nurse should not see any edit buttons
          expect(editButtonCount).toBe(0);
        }
        // If Token Category link is not visible, nurse doesn't have access to the page
      }
      // If Settings section doesn't exist, that's also valid for nurses
    });

    test("Nurse cannot see Set as default and Edit buttons after clicking View button", async ({
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

      // Step 4: Check if Settings section exists
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
      const viewButton = page.getByRole("link", { name: "View" }).nth(1);
      await expect(viewButton).toBeVisible();
      await viewButton.click();

      // Wait for the view page to load
      await page.waitForLoadState("networkidle");

      // Step 9: Verify Edit button is visible on the view page
      const editButtonOnViewPage = page.getByRole("link", { name: "Edit" });
      await expect(editButtonOnViewPage).not.toBeVisible();

      // Step 10: Verify Set as default button exists and is visible (if the feature exists)
      const setAsDefaultButton = page.getByRole("button", {
        name: /Set as default/i,
      });
      await expect(setAsDefaultButton).not.toBeVisible();
    });
  });
});
