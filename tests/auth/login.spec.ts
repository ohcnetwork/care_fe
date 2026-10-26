import { expect, test } from "@playwright/test";

test.describe("Login", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Navigate to login
    await page.getByRole("button", { name: /log in as staff/i }).click();

    // Verify we're on the login page
    await expect(page).toHaveURL(/.*login/);
  });

  test("should display login form and support keyboard password visibility", async ({
    page,
  }) => {
    await page.goto("/login");

    // Check for username field
    await expect(
      page.getByRole("textbox", { name: /username/i }),
    ).toBeVisible();

    // Check for password field
    const password = page.getByLabel(/^password$/i);
    await expect(password).toBeVisible();

    await password.fill("keyboard-preview");
    await password.press("Tab");
    const reveal = page.getByRole("button", { name: /^show password$/i });
    await expect(reveal).toBeFocused();
    await reveal.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: /^hide password$/i }).press("Space");
    await expect(password).toHaveAttribute("type", "password");

    // Check for login button
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/login");

    // Click login button without filling the form
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for and verify error messages appear
    await expect(
      page.getByText(/this field is required/i).first(),
    ).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Fill in invalid credentials
    await page.getByRole("textbox", { name: /username/i }).fill("invaliduser");
    await page.getByLabel(/^password$/i).fill("wrongpassword");

    // Submit the form
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for error notification
    await expect(page.getByText(/no active account found/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
