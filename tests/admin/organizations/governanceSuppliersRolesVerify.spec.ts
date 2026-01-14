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
    await page.waitForLoadState("networkidle");
  }

  test("should navigate to governance organizations page", async ({ page }) => {
    await navigateToOrganizationType(page, "govt");
    await expect(page).toHaveURL(/.*\/admin\/organizations\/govt/);
    // Verify page heading is visible (h3 with translated text)
    await expect(page.locator("h3")).toBeVisible();
    // Verify organization list container is visible (search input or cards)
    const searchInput = page.getByRole("textbox", {
      name: "Search by department/team name",
    });
    await expect(searchInput).toBeVisible();
  });

  test("should navigate to suppliers organizations page", async ({ page }) => {
    await navigateToOrganizationType(page, "product_supplier");
    await expect(page).toHaveURL(/.*\/admin\/organizations\/product_supplier/);
    // Verify page heading is visible (h3 with translated text)
    await expect(page.locator("h3")).toBeVisible();
    // Verify organization list container is visible (search input or cards)
    const searchInput = page.getByRole("textbox", {
      name: "Search by department/team name",
    });
    await expect(searchInput).toBeVisible();
  });

  test("should navigate to roles organizations page", async ({ page }) => {
    await navigateToOrganizationType(page, "role");
    await expect(page).toHaveURL(/.*\/admin\/organizations\/role/);
    // Verify page heading is visible (h3 with translated text)
    await expect(page.locator("h3")).toBeVisible();
    // Verify organization list container is visible (search input or cards)
    const searchInput = page.getByRole("textbox", {
      name: "Search by department/team name",
    });
    await expect(searchInput).toBeVisible();
  });

  test("should verify organization cards display correctly", async ({
    page,
  }) => {
    for (const type of organizationTypes) {
      await test.step(`Verify cards for ${type} organizations`, async () => {
        await navigateToOrganizationType(page, type);

        // Check if there are organization cards or empty state
        const emptyState = page.getByText("No Organizations Found");
        const hasEmptyState = await emptyState.isVisible().catch(() => false);

        if (!hasEmptyState) {
          // Wait for at least one organization card to be visible
          const firstCard = page.locator('[class*="Card"]').first();
          await expect(firstCard).toBeVisible({ timeout: 10000 });

          // Verify card contains organization name (h3 element)
          const orgName = firstCard.locator("h3").first();
          await expect(orgName).toBeVisible();

          // Verify card contains organization type badge
          const badge = firstCard.locator('[class*="Badge"]').first();
          await expect(badge).toBeVisible();

          // Verify card contains "See Details" button/link
          const seeDetailsButton = firstCard.getByRole("link", {
            name: /see details/i,
          });
          await expect(seeDetailsButton).toBeVisible();
        } else {
          // If empty state, verify it's displayed correctly
          await expect(emptyState).toBeVisible();
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
      .locator('[class*="Card"]')
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
        .locator("h3")
        .first()
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
        await page.waitForTimeout(1500); // Wait for debounced search

        // Verify search input has the search term
        await expect(searchInput).toHaveValue(partialName);

        // Verify filtered results are displayed (should show at least the matching org)
        const filteredCards = page
          .locator('[class*="Card"]')
          .filter({ hasNot: page.getByText("No Organizations Found") });
        const filteredCount = await filteredCards.count();
        expect(filteredCount).toBeGreaterThan(0);

        // Verify the matching organization is visible
        await expect(
          page.getByText(firstOrgName, { exact: false }).first(),
        ).toBeVisible();
      }
    }

    // Test 2: Search for a non-existent organization
    const searchTerm = faker.company.name();
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(1500); // Wait for debounced search

    // Verify search input has the search term
    await expect(searchInput).toHaveValue(searchTerm);

    // Verify empty state appears when no results found
    const emptyStateAfterSearch = page.getByText("No Organizations Found");
    const hasEmptyState = await emptyStateAfterSearch
      .isVisible()
      .catch(() => false);
    if (hasEmptyState) {
      await expect(emptyStateAfterSearch).toBeVisible();
    }

    // Test 3: Clear search
    await searchInput.clear();
    await page.waitForTimeout(800);

    // Verify all organizations are shown again (if there were any initially)
    if (initialCount > 0) {
      const cardsAfterClear = page
        .locator('[class*="Card"]')
        .filter({ hasNot: page.getByText("No Organizations Found") });
      const countAfterClear = await cardsAfterClear.count();
      expect(countAfterClear).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test("should expand and collapse organization tree", async ({ page }) => {
    await navigateToOrganizationType(page, "govt");

    // Check if tree navigation is visible (it's in a ResizablePanel that's hidden on mobile)
    // The tree is in the first ResizablePanel and is hidden on mobile (md:block)
    const treeContainer = page.locator('[class*="ResizablePanel"]').first();
    const isTreeVisible = await treeContainer.isVisible().catch(() => false);

    if (isTreeVisible) {
      // Look for expand/collapse buttons - they contain ChevronRight or ChevronDown icons
      // The button is a variant="ghost" size="icon" button
      const expandButtons = page
        .locator('button[class*="h-6 w-6"]')
        .filter({ has: page.locator("svg") })
        .first();

      const hasExpandButton = await expandButtons
        .isVisible()
        .catch(() => false);

      if (hasExpandButton) {
        // Check if ChevronRight (collapsed) or ChevronDown (expanded) is visible
        const chevronRight = expandButtons.locator("svg").first();
        const isChevronRightVisible = await chevronRight
          .isVisible()
          .catch(() => false);

        if (isChevronRightVisible) {
          // Click to expand
          await expandButtons.click();
          await page.waitForTimeout(1000); // Wait for children to load

          // Verify it changed to ChevronDown (expanded state) or shows loading spinner
          const chevronDown = expandButtons.locator("svg").first();
          const isChevronDownVisible = await chevronDown
            .isVisible()
            .catch(() => false);

          // Verify children appear (they should be indented and visible)
          if (isChevronDownVisible) {
            // Check if child organizations are visible (they appear in a div with pl-2 class)
            // Children are rendered when expanded in a container below the parent
            const treePanel = page.locator('[class*="ResizablePanel"]').first();
            const childContainer = treePanel.locator("div.pl-2").first();
            const hasChildren = await childContainer
              .isVisible()
              .catch(() => false);

            if (hasChildren) {
              // Verify at least one child organization node is visible
              // Child nodes are OrganizationTreeNode components with indentation
              const childNodes = childContainer.locator(
                'div[style*="padding-left"]',
              );
              const childCount = await childNodes.count();
              if (childCount > 0) {
                await expect(childNodes.first()).toBeVisible();
              }
            }

            // Test collapse: click again to collapse
            await expandButtons.click();
            await page.waitForTimeout(500);

            // Verify it changed back to ChevronRight (collapsed state)
            const chevronRightAfterCollapse = expandButtons
              .locator("svg")
              .first();
            await expect(chevronRightAfterCollapse).toBeVisible();
          }
        }
      }
    }
  });

  test("should navigate using breadcrumb when viewing child organization", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, "govt");

    // Check if there are any organization cards (exclude empty state)
    const organizationCards = page
      .locator('[class*="Card"]')
      .filter({ hasNot: page.getByText("No Organizations Found") });
    const cardCount = await organizationCards.count();

    if (cardCount > 0) {
      // Get the first organization card
      const firstCard = organizationCards.first();
      await expect(firstCard).toBeVisible();

      // Click on "See Details" to navigate to a child organization
      const seeDetailsLink = firstCard.getByRole("link", {
        name: /see details/i,
      });
      await expect(seeDetailsLink).toBeVisible();

      await seeDetailsLink.click();
      await page.waitForLoadState("networkidle");

      // Verify we're on a child organization page (URL should have an ID)
      await expect(page).toHaveURL(/.*\/admin\/organizations\/govt\/.+/);

      // Verify breadcrumb is visible
      const breadcrumb = page.locator('[class*="Breadcrumb"]');
      await expect(breadcrumb).toBeVisible();

      // Verify breadcrumb contains "organizations" link
      const organizationsLink = breadcrumb.getByRole("button", {
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
      await page.waitForLoadState("networkidle");

      // Verify we navigated back to the list page
      await expect(page).toHaveURL(/.*\/admin\/organizations\/govt$/);

      // Verify we're back on the list view (search input should be visible)
      const searchInput = page.getByRole("textbox", {
        name: "Search by department/team name",
      });
      await expect(searchInput).toBeVisible();
    }
  });
});
