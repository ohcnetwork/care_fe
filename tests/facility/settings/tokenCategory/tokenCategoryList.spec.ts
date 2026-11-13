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

      // Verify categories are grouped into one section per resource type
      for (const resourceType of [
        "Practitioner",
        "Location",
        "Healthcare Service",
      ]) {
        await expect(
          page.getByRole("region", { name: resourceType, exact: true }),
        ).toBeVisible();
      }

      // Verify at least one category is listed with its actions
      const firstCategory = page
        .locator('[data-cy^="token-category-group-"]')
        .getByRole("listitem")
        .first();
      await expect(firstCategory).toBeVisible();
      await expect(
        firstCategory.getByRole("link", { name: "View" }),
      ).toBeVisible();
      await expect(
        firstCategory.getByRole("button", { name: /^Edit / }),
      ).toBeVisible();

      // Verify Token Category is visible in sidebar
      const sidebarToggle = page
        .locator('[data-cy="facility-settings-page-header"]')
        .getByRole("button", { name: "Toggle Sidebar", exact: true });
      await expect(sidebarToggle).toBeVisible();
      if ((await sidebarToggle.getAttribute("aria-expanded")) !== "true") {
        await sidebarToggle.click();
      }

      const tokenCategoryLink = page
        .locator('[data-sidebar="sidebar"]')
        .getByRole("link", { name: "Token Category", exact: true });
      await expect(tokenCategoryLink).toBeVisible();
    });
  });

  test.describe("Volunteer Access", () => {
    test.beforeEach(async ({ page }) => {
      // Login as volunteer
      await page.goto("/login");
      await page
        .getByRole("textbox", { name: /username/i })
        .fill("care-volunteer");
      await page.getByLabel(/^password$/i).fill("Ohcn@123");
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.waitForURL(/(?!.*login)/, { timeout: 15000 });

      // Verify we're logged in as volunteer
      await expect(
        page.getByRole("heading", {
          name: /^Good (Morning|Afternoon|Evening), .+/,
        }),
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

      // Step 3: Verify categories and actions are NOT visible
      await expect(
        page.locator('[data-cy^="token-category-group-"]'),
      ).toHaveCount(0);
      await expect(page.getByRole("link", { name: "View" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Edit / })).toHaveCount(0);

      // Step 4: Verify Token Category link is NOT visible in sidebar
      const sidebarToggle = page
        .locator('[data-cy="facility-settings-page-header"]')
        .getByRole("button", { name: "Toggle Sidebar", exact: true });
      await expect(sidebarToggle).toBeVisible();
      if ((await sidebarToggle.getAttribute("aria-expanded")) !== "true") {
        await sidebarToggle.click();
      }
      const tokenCategoryLink = page
        .locator('[data-sidebar="sidebar"]')
        .getByRole("link", { name: "Token Category", exact: true });
      await expect(tokenCategoryLink).toHaveCount(0);
    });
  });
});
