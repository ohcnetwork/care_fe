import { expect, test } from "@playwright/test";

/**
 * User Deletion Access Control Tests
 *
 * Tests verify that delete account functionality is properly restricted
 * based on user permissions:
 * - Admin users: Can see and access delete account button
 * - Staff users: Cannot see delete account button (no permission)
 */

test.describe("User Deletion Access Control", () => {
  test.describe("Admin User Access", () => {
    test("admin should see delete account button for users", async ({
      page,
    }) => {
      // Navigate to the application
      await page.goto("http://localhost:4000/");

      // Login as admin user
      await page.getByRole("button", { name: "Log in as Staff" }).click();
      await page.getByRole("textbox", { name: "Username" }).fill("admin");
      await page.getByRole("textbox", { name: "Password" }).fill("admin");
      await page.getByRole("button", { name: "Login" }).click();

      // Wait for successful login and navigate to facility
      await expect(page).toHaveURL(/(?!.*login)/, { timeout: 15000 });

      // Navigate to first available facility
      const firstFacilityLink = page
        .getByRole("link")
        .filter({ hasText: "View" })
        .first();
      await expect(firstFacilityLink).toBeVisible({ timeout: 10000 });
      await firstFacilityLink.click();
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      await page.getByRole("link", { name: "Users" }).click();

      // Wait for users page to load by checking for See Details button
      const seeDetailsButton = page
        .getByRole("button", { name: "See Details" })
        .first();
      await expect(seeDetailsButton).toBeVisible({ timeout: 10000 });

      // Click on the first user's "See Details" button
      await seeDetailsButton.click();

      // Verify that delete account button is visible for admin
      const deleteButton = page.getByRole("button", { name: "Delete Account" });
      await expect(deleteButton).toBeVisible({ timeout: 10000 });

      // Verify the button is clickable (not disabled)
      await expect(deleteButton).toBeEnabled();
    });
  });

  test.describe("Staff User Access", () => {
    test("staff should not see delete account button for users", async ({
      page,
    }) => {
      // Navigate to the application
      await page.goto("http://localhost:4000/");

      // Login as staff user
      await page.getByRole("button", { name: "Log in as Staff" }).click();
      await page.getByRole("textbox", { name: "Username" }).fill("staff_2_0");
      await page
        .getByRole("textbox", { name: "Password" })
        .fill("Coronasafe@123");
      await page.getByRole("button", { name: "Login" }).click();

      // Wait for successful login
      await expect(page).toHaveURL(/(?!.*login)/, { timeout: 15000 });

      // Navigate to first available facility
      const firstFacilityLink = page
        .getByRole("link")
        .filter({ hasText: "View" })
        .first();
      await expect(firstFacilityLink).toBeVisible({ timeout: 10000 });
      await firstFacilityLink.click();
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      await page.getByRole("link", { name: "Users" }).click();

      // Wait for users page to load by checking for See Details button
      const seeDetailsButton = page
        .getByRole("button", { name: "See Details" })
        .first();
      await expect(seeDetailsButton).toBeVisible({ timeout: 10000 });

      // Click on the first user's "See Details" button
      await seeDetailsButton.click();

      // Verify that delete account button is NOT visible for staff
      const deleteButton = page.getByRole("button", { name: "Delete Account" });

      // Use toBeHidden() or check that the button doesn't exist
      await expect(deleteButton).toBeHidden();

      // Alternative check: ensure the button is not in the DOM at all
      const deleteButtonCount = await page
        .getByRole("button", { name: "Delete Account" })
        .count();
      expect(deleteButtonCount).toBe(0);
    });
  });
});
