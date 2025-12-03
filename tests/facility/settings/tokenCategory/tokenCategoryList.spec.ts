import { expect, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.describe("Token Category List - Permission Tests", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test.describe("Admin Access", () => {
    // Use admin authenticated state
    test.use({ storageState: "tests/.auth/user.json" });

    test("Admin can see Token Category in sidebar and list token", async ({
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

      // Verify the page heading is visible
      await expect(
        page.getByRole("heading", { name: "Token Categories" }),
      ).toBeVisible();

      // Verify table structure is present
      const table = page.locator("table");
      await expect(table).toBeVisible();

      // Verify table has data rows (tbody should have at least one row)
      const tableBody = page.locator("tbody");
      const rowCount = await tableBody.locator("tr").count();
      expect(rowCount).toBeGreaterThan(0);

      // Verify action buttons (View/Edit) are present in at least one row
      await expect(
        page.getByRole("link", { name: "View" }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Edit" }).first(),
      ).toBeVisible();

      // Verify Token Category is visible in sidebar
      const sidebarToggle = page.getByRole("button", {
        name: "Toggle Sidebar",
      });
      await expect(sidebarToggle).toBeVisible();
      await sidebarToggle.click();

      const settingsSection = page.getByRole("button", { name: "Settings" });
      await expect(settingsSection).toBeVisible();
      await settingsSection.click();

      const tokenCategoryLink = page.getByRole("link", {
        name: "Token Category",
      });
      await expect(tokenCategoryLink).toBeVisible();
    });
  });

  test.describe("Volunteer Access", () => {
    test.beforeEach(async ({ page }) => {
      // Login as volunteer
      await page.goto("/login");
      await page
        .getByRole("textbox", { name: /username/i })
        .fill("volunteer_2_0");
      await page.getByLabel(/password/i).fill("Coronasafe@123");
      await page.getByRole("button", { name: /login/i }).click();
      await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

      // Verify we're logged in as volunteer
      await expect(
        page.getByRole("heading", { name: /^Hey .+/ }),
      ).toBeVisible();
    });

    test("Volunteer cannot see Token Category in sidebar and list", async ({
      page,
    }) => {
      // Step 1: Navigate directly to token category page
      await page.goto(`/facility/${facilityId}/settings/token_category`);

      // Wait for access denied message to be visible instead of networkidle
      const accessDeniedMessage = page.getByText(
        "Access Denied to Token Category",
      );
      await expect(accessDeniedMessage).toBeVisible({ timeout: 10000 });

      // Step 2: Verify access denied message is shown

      // Step 3: Verify table and data are NOT visible
      const table = page.locator("table");
      await expect(table).not.toBeVisible();

      // Verify action buttons are NOT visible
      const viewButtons = page.getByRole("link", { name: "View" });
      const editButtons = page.getByRole("link", { name: "Edit" });
      expect(await viewButtons.count()).toBe(0);
      expect(await editButtons.count()).toBe(0);

      // Step 4: Verify Token Category link is NOT visible in sidebar
      const sidebarToggle = page.getByRole("button", {
        name: "Toggle Sidebar",
      });
      await expect(sidebarToggle).toBeVisible();
      await sidebarToggle.click();

      const settingsSection = page.getByRole("button", { name: "Settings" });
      await expect(settingsSection).toBeVisible();
      await settingsSection.click();

      const tokenCategoryLink = page.getByRole("link", {
        name: "Token Category",
      });
      await expect(tokenCategoryLink).not.toBeVisible();
    });
  });
});
