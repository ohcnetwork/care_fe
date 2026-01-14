import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Governance, Suppliers, and Roles User Role Verification", () => {
  const organizationTypes = ["govt", "product_supplier", "role"] as const;
  type OrganizationType = (typeof organizationTypes)[number];

  /**
   * Navigate to specific organization type page
   */
  async function navigateToOrganizationType(
    page: Page,
    type: OrganizationType,
  ) {
    await page.goto(`/admin/organizations/${type}`);
    await page.waitForLoadState("domcontentloaded");
    await page
      .getByRole("textbox", { name: "Search by department/team name" })
      .waitFor({ state: "visible" });
  }

  test("should navigate to organization type pages", async ({ page }) => {
    for (const type of organizationTypes) {
      await test.step(`Navigate to ${type} organizations page`, async () => {
        await navigateToOrganizationType(page, type);
        await expect(page).toHaveURL(
          new RegExp(`.*\\/admin\\/organizations\\/${type}`),
        );
        // Verify page heading is visible (h3 with translated text)
        // Use .first() to avoid strict mode violation when multiple h3 elements exist
        await expect(page.locator("h3").first()).toBeVisible();
        // Verify organization list container is visible (search input or cards)
        const searchInput = page.getByRole("textbox", {
          name: "Search by department/team name",
        });
        await expect(searchInput).toBeVisible();
      });
    }
  });

  test("should verify organization cards display correctly", async ({
    page,
  }) => {
    for (const type of organizationTypes) {
      await test.step(`Verify cards for ${type} organizations`, async () => {
        await navigateToOrganizationType(page, type);

        // Wait for loading to complete - check for either cards or empty state
        const emptyState = page.getByText("No Organizations Found");
        const cards = page.getByTestId("org-card");

        // Wait for either cards or empty state to appear (loading skeleton should be gone)
        const firstCard = cards.first();
        try {
          // Try to wait for cards first with a timeout
          await expect(firstCard).toBeVisible({ timeout: 10000 });

          // Verify card structure
          const orgName = firstCard.getByRole("heading", { level: 3 });
          await expect(orgName).toBeVisible();

          const badge = firstCard.getByTestId("org-badge");
          await expect(badge).toBeVisible();

          const seeDetailsButton = firstCard.getByRole("link", {
            name: /see details/i,
          });
          await expect(seeDetailsButton).toBeVisible();
        } catch {
          // If cards don't appear, wait for and verify empty state is shown
          // Empty state appears after loading completes - wait with longer timeout
          await expect(emptyState).toBeVisible({ timeout: 15000 });
        }
      });
    }
  });

  test("should filter organizations by name when searching", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, "govt");

    // Get initial organization count (if any) - exclude empty state card
    const initialCards = page
      .getByTestId("org-card")
      .filter({ hasNot: page.getByText("No Organizations Found") });
    const initialCount = await initialCards.count();

    // Verify search input is visible
    const searchInput = page.getByRole("textbox", {
      name: "Search by department/team name",
    });
    await expect(searchInput).toBeVisible();

    if (initialCount > 0) {
      // Get the name of the first organization to test with actual data
      const firstCard = initialCards.first();
      const firstOrgName = await firstCard
        .getByRole("heading", { level: 3 })
        .textContent()
        .then((text) => text?.trim())
        .catch(() => null);

      if (firstOrgName) {
        // Test 1: Search with partial name of existing organization
        const partialName = firstOrgName.substring(
          0,
          Math.min(5, firstOrgName.length),
        );
        await searchInput.fill(partialName);

        // Wait for the search results to update by waiting for the matching organization to be visible
        await expect(
          page.getByText(firstOrgName, { exact: false }).first(),
        ).toBeVisible({ timeout: 5000 });

        // Verify search input has the search term
        await expect(searchInput).toHaveValue(partialName);

        // Verify filtered results are displayed (should show at least the matching org)
        const filteredCards = page
          .getByTestId("org-card")
          .filter({ hasNot: page.getByText("No Organizations Found") });
        const filteredCount = await filteredCards.count();
        expect(filteredCount).toBeGreaterThan(0);
      }
    }

    // Test 2: Search for a non-existent organization
    // Use a guaranteed-nonexistent term to make the empty-state assertion deterministic
    const searchTerm = `NonExistent_${faker.string.uuid()}`;
    await searchInput.fill(searchTerm);

    // Wait for the search results to update by waiting for the empty state to appear
    const emptyStateAfterSearch = page.getByText("No Organizations Found");
    await expect(emptyStateAfterSearch).toBeVisible({ timeout: 5000 });

    // Verify search input has the search term
    await expect(searchInput).toHaveValue(searchTerm);

    // Test 3: Clear search
    await searchInput.clear();

    // Verify all organizations are shown again (if there were any initially)
    if (initialCount > 0) {
      // Wait for the cards to reappear after clearing search
      const cardsAfterClear = page
        .getByTestId("org-card")
        .filter({ hasNot: page.getByText("No Organizations Found") });
      await expect(cardsAfterClear.first()).toBeVisible({ timeout: 5000 });
      const countAfterClear = await cardsAfterClear.count();
      expect(countAfterClear).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test("should expand and collapse organization tree", async ({ page }) => {
    await navigateToOrganizationType(page, "govt");

    // Get the ResizablePanel locator (treePanel) - tree is in the first ResizablePanel
    // The tree is hidden on mobile (md:block), so skip test if not visible
    const treePanel = page.locator('[class*="ResizablePanel"]').first();
    const isTreeVisible = await treePanel.isVisible().catch(() => false);

    if (!isTreeVisible) {
      test.skip(true, "Tree navigation not visible (possibly mobile viewport)");
      return;
    }

    // Assert tree panel is visible
    await expect(treePanel).toBeVisible();

    // Look for expand/collapse button using stable data-testid selector
    const expandButtons = page.getByTestId("org-tree-toggle").first();

    // Assert expand button is visible
    await expect(expandButtons).toBeVisible({ timeout: 5000 });

    // Locate child container to verify state changes
    const childContainer = treePanel.locator("div.pl-2").first();

    // Verify initial collapsed state: child container should not be visible
    await expect(childContainer).not.toBeVisible();

    // Click to expand
    await expandButtons.click();

    // Verify expansion by checking for child elements (this confirms the icon changed to expanded state)
    await expect(childContainer).toBeVisible({ timeout: 5000 });

    // Verify at least one child organization node is visible
    // Child nodes are OrganizationTreeNode components with indentation
    const childNodes = childContainer.locator('div[style*="padding-left"]');
    const childCount = await childNodes.count();
    expect(childCount).toBeGreaterThan(0);
    await expect(childNodes.first()).toBeVisible();

    // Click to collapse
    await expandButtons.click();

    // Assert the childContainer collapsed (no longer visible) - this confirms the icon changed back to collapsed state
    await expect(childContainer).not.toBeVisible({ timeout: 5000 });
  });

  test("should navigate using breadcrumb when viewing child organization", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, "govt");

    // Check if there are any organization cards (exclude empty state)
    const organizationCards = page
      .getByTestId("org-card")
      .filter({ hasNot: page.getByText("No Organizations Found") });
    const cardCount = await organizationCards.count();

    if (cardCount === 0) {
      test.skip(true, "No organizations available for govt org tests");
      return;
    }

    // Get the first organization card
    const firstCard = organizationCards.first();
    await expect(firstCard).toBeVisible();

    // Click on "See Details" to navigate to a child organization
    const seeDetailsLink = firstCard.getByRole("link", {
      name: /see details/i,
    });
    await expect(seeDetailsLink).toBeVisible();

    await seeDetailsLink.click();
    await page.waitForLoadState("domcontentloaded");
    // Wait for breadcrumb to be visible as indicator that child page is loaded
    const breadcrumb = page.getByTestId("org-breadcrumb");
    await breadcrumb.waitFor({ state: "visible" });

    // Verify we're on a child organization page (URL should have an ID)
    await expect(page).toHaveURL(/.*\/admin\/organizations\/govt\/.+/);

    // Verify breadcrumb is visible
    await expect(breadcrumb).toBeVisible();

    // Verify breadcrumb contains "organizations" link
    const organizationsLink = breadcrumb.getByRole("link", {
      name: /organizations/i,
    });
    await expect(organizationsLink).toBeVisible();

    // Verify breadcrumb shows current organization name (if hierarchical)
    const breadcrumbItems = breadcrumb.locator("span, button");
    const breadcrumbText = await breadcrumbItems
      .allTextContents()
      .then((texts) => texts.join(" "))
      .catch(() => "");

    // Breadcrumb should contain organization-related text
    expect(breadcrumbText.toLowerCase()).toContain("organization");

    // Click on organizations link in breadcrumb
    await organizationsLink.click();
    await page.waitForLoadState("domcontentloaded");
    // Wait for search input to be visible as indicator that list page is loaded
    const searchInput = page.getByRole("textbox", {
      name: "Search by department/team name",
    });
    await searchInput.waitFor({ state: "visible" });

    // Verify we navigated back to the list page
    await expect(page).toHaveURL(/.*\/admin\/organizations\/govt$/);

    // Verify we're back on the list view (search input should be visible)
    await expect(searchInput).toBeVisible();
  });
});
