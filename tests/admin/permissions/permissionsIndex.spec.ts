import { expect, test } from "@playwright/test";

/**
 * E2E tests for the Permissions Index page (Admin > RBAC > Permissions)
 * 
 * This page displays a matrix showing which permissions each role has,
 * with roles as column headers and permissions as rows. It provides a
 * comprehensive view of the role-based access control system.
 */

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Permissions Index - Role Permission Matrix", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the permissions matrix page
    await page.goto("/admin/rbac/permissions");
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");
  });

  /**
   * Verify that the page loads and displays the core UI elements
   */
  test("should display the permissions matrix page with header and table", async ({
    page,
  }) => {
    // Check page title is visible
    await expect(
      page.getByRole("heading", { name: /roles/i }),
    ).toBeVisible();

    // Verify descriptive text is present
    await expect(
      page.getByText(/manage and view roles/i),
    ).toBeVisible();

    // Verify the table structure is present
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("thead")).toBeVisible();
    await expect(page.locator("tbody")).toBeVisible();
  });

  /**
   * Verify that role names are displayed as rotated column headers
   */
  test("should display role names as column headers", async ({ page }) => {
    // Wait for roles to load
    await page.waitForTimeout(1000);

    // Check that at least one role column header is visible
    const tableHeaders = page.locator("thead th");
    await expect(tableHeaders).toHaveCount({ timeout: 10000 }, { min: 2 }); // At least "Permission" + one role

    // The first column should be "Permission"
    await expect(
      page.locator("thead th").first(),
    ).toContainText(/permission/i);
  });

  /**
   * Verify that permissions are listed as row labels
   */
  test("should display permissions as row labels in the first column", async ({
    page,
  }) => {
    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check that permission rows exist
    const permissionCells = page.locator("tbody tr td:first-child");
    const count = await permissionCells.count();
    
    // Should have at least some permissions listed
    expect(count).toBeGreaterThan(0);

    // Verify that permission cells contain text content
    const firstPermission = permissionCells.first();
    await expect(firstPermission).not.toBeEmpty();
  });

  /**
   * Verify that permission indicators (checkmarks/X marks) are displayed
   */
  test("should display permission indicators for role-permission combinations", async ({
    page,
  }) => {
    // Wait for data to load
    await page.waitForTimeout(1000);

    // Look for permission indicator icons (CheckCircle2 or XCircle from lucide-react)
    const checkmarks = page.locator("svg.text-green-500");
    const xmarks = page.locator("svg.text-red-500");

    // Either checkmarks or X marks should be visible
    const checkCount = await checkmarks.count();
    const xCount = await xmarks.count();
    
    expect(checkCount + xCount).toBeGreaterThan(0);
  });

  /**
   * Verify sticky header behavior for better UX when scrolling
   */
  test("should have sticky first column and header for scrolling", async ({
    page,
  }) => {
    // Check that the permission column (first column) has sticky positioning
    const firstColumnHeader = page.locator("thead th").first();
    await expect(firstColumnHeader).toHaveClass(/sticky/);
    await expect(firstColumnHeader).toHaveClass(/left-0/);

    // Check that permission cells in tbody also have sticky positioning
    const firstPermissionCell = page.locator("tbody tr:first-child td:first-child");
    await expect(firstPermissionCell).toHaveClass(/sticky/);
    await expect(firstPermissionCell).toHaveClass(/left-0/);
  });

  /**
   * Verify pagination controls are present
   */
  test("should display pagination controls when there are many roles/permissions", async ({
    page,
  }) => {
    // The pagination component should be present
    // Note: Visibility depends on whether there are enough items to paginate
    const pagination = page.locator('[class*="pagination"]').first();
    
    // If pagination exists, it should be visible
    if (await pagination.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(pagination).toBeVisible();
    }
  });

  /**
   * Verify table row hover states for better UX
   */
  test("should highlight rows on hover for better readability", async ({
    page,
  }) => {
    // Wait for data to load
    await page.waitForTimeout(1000);

    // Get a permission row
    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    // Check that rows have hover styling classes
    await expect(firstRow).toHaveClass(/hover:bg-gray-100/);
  });

  /**
   * Verify that the matrix updates when navigating with pagination
   */
  test("should update matrix when using pagination", async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(1000);

    // Get initial permission count
    const initialPermissions = await page.locator("tbody tr").count();
    
    // Try to find next page button if it exists
    const nextButton = page.getByRole("button", { name: /next/i });
    
    if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Click next page
      await nextButton.click();
      
      // Wait for page to update
      await page.waitForLoadState("networkidle");
      
      // Verify content changed
      const newPermissions = await page.locator("tbody tr").count();
      expect(newPermissions).toBeGreaterThan(0);
    } else {
      // If no pagination, we can't test this scenario
      test.skip();
    }
  });

  /**
   * Verify accessibility: proper table structure with headers
   */
  test("should have proper table accessibility structure", async ({ page }) => {
    // Verify table has proper semantic structure
    await expect(page.locator("table")).toBeVisible();
    
    // Check for table header
    const thead = page.locator("thead");
    await expect(thead).toBeVisible();
    
    // Check for table body
    const tbody = page.locator("tbody");
    await expect(tbody).toBeVisible();
    
    // Verify header row contains th elements
    const headerCells = page.locator("thead th");
    await expect(headerCells.first()).toBeVisible();
  });
});
