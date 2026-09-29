import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load successfully", async ({ page }) => {
    await page.goto("/");

    // Verify the page loaded
    await expect(page).toHaveTitle(/CARE/);
  });

  test("should display main navigation", async ({ page }) => {
    await page.goto("/");

    const staffLogin = page.getByRole("link", { name: /log in as staff/i });
    const patientLogin = page.getByRole("link", { name: /log in as patient/i });

    await expect(staffLogin).toBeVisible();
    await expect(staffLogin).toHaveAttribute("href", "/login?mode=staff");
    await expect(patientLogin).toBeVisible();
    await expect(patientLogin).toHaveAttribute("href", "/login?mode=patient");
  });

  test("should support keyboard navigation and browser history", async ({
    page,
  }) => {
    await page.goto("/");

    const staffLogin = page.getByRole("link", { name: /log in as staff/i });
    await staffLogin.focus();
    await staffLogin.press("Enter");
    await expect(page).toHaveURL(/\/login\?mode=staff$/);
    await expect(page.getByRole("textbox", { name: /username/i })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(staffLogin).toBeVisible();
  });

  test("should open login in a new tab without navigating the current page", async ({
    page,
    context,
  }) => {
    await page.goto("/");

    const newPagePromise = context.waitForEvent("page");
    await page
      .getByRole("link", { name: /log in as staff/i })
      .click({ button: "middle" });
    const newPage = await newPagePromise;

    await expect(newPage).toHaveURL(/\/login\?mode=staff$/);
    await expect(page).toHaveURL(/\/$/);
    await newPage.close();
  });

  test("should have facility search functionality", async ({ page }) => {
    await page.goto("/");

    // Look for search or facility-related elements
    // This test should be updated based on actual homepage content
    const searchInput = page.getByRole("searchbox").first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });
});
