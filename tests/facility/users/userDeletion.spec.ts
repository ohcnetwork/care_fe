import { expect, test } from "@playwright/test";

test.describe("User Deletion Access Control", () => {
  test("admin user should have access to delete account button", async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto("/");
    await page.getByRole("button", { name: "Log in as Staff" }).click();

    // Login as admin
    await page.getByRole("textbox", { name: "Username" }).fill("admin");
    await page.getByRole("textbox", { name: "Password" }).fill("admin");
    await page.getByRole("button", { name: "Login" }).click();

    // Navigate to facility (assuming this is required to access user profile)
    await page
      .getByRole("link", { name: "FACILITY WITH PATIENTS View" })
      .click();

    // Open sidebar and navigate to profile
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Admin User admin" }).click();
    await page.getByRole("menuitem", { name: "Profile" }).click();

    // Verify delete account button is visible and accessible for admin
    const deleteButton = page.getByRole("button", { name: "Delete Account" });
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeEnabled();
  });

  test("staff user should not have access to delete account button", async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto("/");
    await page.getByRole("button", { name: "Log in as Staff" }).click();

    // Login as staff user
    await page.getByRole("textbox", { name: "Username" }).fill("staff_2_0");
    await page
      .getByRole("textbox", { name: "Password" })
      .fill("Coronasafe@123");
    await page.getByRole("button", { name: "Login" }).click();

    // Wait for successful login
    await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

    // Navigate to facility (assuming this is required to access user profile)
    // Note: The link text might be different for staff users
    await page
      .getByRole("link", { name: "Sen, Palla and Vig View" })
      .first()
      .click();

    // Open sidebar and navigate to profile
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();

    // Look for user profile button - might have different text for staff
    const profileButton = page.getByRole("button", {
      name: "Oscar Borde staff_2_0",
    });
    await expect(profileButton).toBeVisible();
    await profileButton.click();

    await page.getByRole("menuitem", { name: "Profile" }).click();

    // Verify delete account button is NOT visible for staff user
    const deleteButton = page.getByRole("button", { name: "Delete Account" });
    await expect(deleteButton).not.toBeVisible();
  });
});
