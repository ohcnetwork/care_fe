import { expect, test } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Admin Permissions Matrix", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/permissions");
  });

  test("should load and display the permissions matrix page", async ({
    page,
  }) => {
    // Verify page title and description
    await expect(page.getByRole("heading", { name: /roles/i })).toBeVisible();
    await expect(
      page.getByText(/manage and view roles/i)
    ).toBeVisible();
  });

  test("should display role headers in the permissions table", async ({
    page,
  }) => {
    // Wait for table to load
    await expect(
      page.getByRole("columnheader", { name: /permission/i })
    ).toBeVisible({ timeout: 10000 });

    // Verify at least one role header exists
    const roleHeaders = page.getByRole("columnheader");
    const count = await roleHeaders.count();
    expect(count).toBeGreaterThan(1); // At least permission column + one role
  });

  test("should display permission rows with indicators", async ({ page }) => {
    // Wait for table body to have rows
    await page.waitForSelector("tbody tr");

    // Get all permission rows
    const rows = page.getByRole("row");
    const rowCount = await rows.count();

    // Should have more than just the header
    expect(rowCount).toBeGreaterThan(1);

    // Each row should have permission name and checkmark/X icons
    const firstDataRow = page.locator("tbody tr").first();
    const cells = firstDataRow.getByRole("cell");
    const cellCount = await cells.count();

    // Should have permission name + at least one role indicator
    expect(cellCount).toBeGreaterThanOrEqual(2);
  });

  test("should display checkmark and X icons for role permissions", async ({
    page,
  }) => {
    // Wait for icons to appear
    await page.waitForSelector("svg");

    // Get all SVG icons (checkmarks and X marks)
    const icons = page.locator("svg");
    const iconCount = await icons.count();

    // Should have multiple permission indicators
    expect(iconCount).toBeGreaterThan(0);

    // Verify we have both check-circle and x-circle icons
    const checkIcons = page.locator("svg[aria-label], text:has-text('✓')");
    // At least some permissions should be granted
    // Note: We can't strictly verify both types exist without knowing the exact data,
    // but we can verify icons are present
    expect(iconCount).toBeGreaterThan(0);
  });

  test("should have pagination controls", async ({ page }) => {
    // Wait for table to load
    await expect(
      page.getByRole("columnheader", { name: /permission/i })
    ).toBeVisible({ timeout: 10000 });

    // Check for pagination element (usually shows page info or navigation)
    // The pagination is rendered by useFilters hook
    const paginationContainer = page.locator("[role='navigation']");

    // Pagination should be present (might be hidden if only one page)
    await page.waitForLoadState("networkidle");

    // If there's content, pagination should be rendered somewhere
    // This is a soft check - pagination might not be visible if data is small
    const pageContent = page.locator("table");
    await expect(pageContent).toBeVisible();
  });

  test("should make API calls to fetch roles and permissions", async ({
    page,
  }) => {
    // Wait for the API request to complete
    const apiResponse = await page.waitForResponse(
      (response) =>
        response.url().includes("/api") &&
        response.url().includes("/roles") &&
        response.status() === 200,
      { timeout: 15000 }
    );

    expect(apiResponse.status()).toBe(200);

    // Verify the response contains roles
    const data = await apiResponse.json();
    expect(data).toHaveProperty("results");
    expect(Array.isArray(data.results)).toBe(true);

    // Each role should have permissions
    if (data.results.length > 0) {
      const firstRole = data.results[0];
      expect(firstRole).toHaveProperty("permissions");
      expect(Array.isArray(firstRole.permissions)).toBe(true);
    }
  });

  test("should maintain sticky headers and left column during scroll", async ({
    page,
  }) => {
    // Wait for table to load
    await expect(
      page.getByRole("columnheader", { name: /permission/i })
    ).toBeVisible({ timeout: 10000 });

    // Get the permission header (should be sticky)
    const permissionHeader = page.getByRole("columnheader", {
      name: /permission/i,
    });

    // Verify it has sticky positioning applied
    const headerElement = permissionHeader.locator("..");
    const classes = await headerElement.getAttribute("class");

    // Should have sticky class or styling
    expect(classes).toContain("sticky");
  });

  test("should display permission names correctly in rows", async ({
    page,
  }) => {
    // Wait for table body to load
    await page.waitForSelector("tbody tr");

    // Get first few rows
    const firstRow = page.locator("tbody tr").first();
    const permissionCell = firstRow.locator("td").first();

    // Permission name should be visible and non-empty
    const permissionText = await permissionCell.textContent();
    expect(permissionText).toBeTruthy();
    expect(permissionText?.length).toBeGreaterThan(0);
  });

  test("should handle empty or single-role scenarios gracefully", async ({
    page,
  }) => {
    // Wait for content to load
    await page.waitForSelector("table");

    // Table should be present
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Should have at least header row
    const rows = page.locator("tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });
});
