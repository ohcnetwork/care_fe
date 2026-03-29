import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Governance, Suppliers, and Roles Organization List UI and Navigation", () => {
  const organizationTypes = ["govt", "product_supplier", "role"] as const;
  type OrganizationType = (typeof organizationTypes)[number];
  const defaultTestType: OrganizationType = "govt";

  const searchInputName = "Search by department/team name";
  const emptyStateText = "No Organizations Found";

  function getTypeHeadingPattern(type: OrganizationType) {
    if (type === "govt") return /gov(?:t|ernance|erence)/i;
    if (type === "product_supplier") return /^suppliers$/i;
    return /^role$/i;
  }

  function getSearchInput(page: Page) {
    return page.getByRole("textbox", { name: searchInputName });
  }

  function getOrgCards(page: Page, type: OrganizationType) {
    return page
      .getByRole("heading", { name: getTypeHeadingPattern(type) })
      .locator("../..")
      .locator('[data-slot="card"]')
      .filter({ hasNot: page.getByText(emptyStateText) });
  }

  async function navigateToOrganizationType(
    page: Page,
    type: OrganizationType,
  ) {
    await page.goto(`/admin/organizations/${type}`, {
      waitUntil: "networkidle",
    });
  }

  async function clickAndWaitForUrl(
    page: Page,
    urlPattern: RegExp,
    clickAction: () => Promise<void>,
  ) {
    await Promise.all([
      page.waitForURL(urlPattern, { waitUntil: "networkidle" }),
      clickAction(),
    ]);
  }

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    await navigateToOrganizationType(page, defaultTestType);
    await expect(
      getOrgCards(page, defaultTestType).first(),
      `Expected at least one ${defaultTestType} organization card for this suite`,
    ).toBeVisible();
    await context.close();
  });

  test("should navigate to organization type pages", async ({ page }) => {
    for (const type of organizationTypes) {
      await test.step(`Navigate to ${type} organizations page`, async () => {
        await navigateToOrganizationType(page, type);
        await expect(page).toHaveURL(
          new RegExp(`.*\\/admin\\/organizations\\/${type}$`),
        );
        await expect(
          page.getByRole("heading", {
            name: getTypeHeadingPattern(type),
          }),
        ).toBeVisible();
        await expect(getSearchInput(page)).toBeVisible();
      });
    }
  });

  test("should verify organization cards display correctly", async ({
    page,
  }) => {
    for (const type of organizationTypes) {
      await test.step(`Verify cards for ${type} organizations`, async () => {
        await navigateToOrganizationType(page, type);

        const cards = getOrgCards(page, type);
        const firstCard = cards.first();
        const emptyState = page.getByText(emptyStateText);

        await expect(firstCard.or(emptyState)).toBeVisible();
        const hasCards = await firstCard.isVisible().catch(() => false);
        if (hasCards) {
          await expect(firstCard.getByRole("heading")).toBeVisible();
          await expect(firstCard.locator('[data-slot="badge"]')).toBeVisible();
          await expect(
            firstCard.getByRole("link", { name: /see details/i }),
          ).toBeVisible();
        }
      });
    }
  });

  test("should navigate to organization detail using see details", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, defaultTestType);

    const firstCard = getOrgCards(page, defaultTestType).first();
    await expect(firstCard).toBeVisible();
    const seeDetailsLink = firstCard.getByRole("link", {
      name: /see details/i,
    });
    await expect(seeDetailsLink).toBeVisible();
    await clickAndWaitForUrl(
      page,
      new RegExp(`.*\\/admin\\/organizations\\/${defaultTestType}\\/[^/]+$`),
      () => seeDetailsLink.click(),
    );
    await expect(page.locator('[data-slot="breadcrumb"]')).toBeVisible();
  });

  test("should filter organizations by name when searching", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, defaultTestType);

    const initialCards = getOrgCards(page, defaultTestType);
    await expect(
      initialCards.nth(1),
      `Expected at least two ${defaultTestType} organization cards for search filtering`,
    ).toBeVisible();
    const initialCount = await initialCards.count();
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible();

    const firstCard = initialCards.first();
    await expect(firstCard).toBeVisible();
    const firstOrgName = (
      await firstCard.getByRole("heading").first().innerText()
    ).trim();
    expect(firstOrgName.length).toBeGreaterThan(0);

    await searchInput.fill(firstOrgName);
    await expect(
      page.getByText(firstOrgName, { exact: true }).first(),
    ).toBeVisible();
    const filteredCount = await getOrgCards(page, defaultTestType).count();
    expect(filteredCount).toBeLessThan(initialCount);

    await searchInput.clear();
    await expect(getOrgCards(page, defaultTestType).first()).toBeVisible();
  });

  test("should show empty state when search has no matches", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, defaultTestType);
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible();

    const searchTerm = `NonExistent_${faker.string.uuid()}`;
    await searchInput.fill(searchTerm);
    await expect(page.getByText(emptyStateText)).toBeVisible();
  });

  test("should expand and collapse organization tree", async ({ page }) => {
    await navigateToOrganizationType(page, defaultTestType);

    const viewport = page.viewportSize();
    if (!viewport || viewport.width < 768) {
      test.skip(true, "Tree navigation hidden on viewport < md (768px)");
      return;
    }

    const treePanel = page.locator('[data-slot="resizable-panel"]').first();
    await expect(treePanel).toBeVisible();
    await expect(treePanel.locator("div.space-y-1").first()).toBeVisible();

    const expandButtons = treePanel
      .getByRole("button")
      .filter({ has: treePanel.locator("svg") });
    expect(await expandButtons.count()).toBeGreaterThan(0);

    const expandBtn = expandButtons.first();
    await expect(expandBtn).toBeVisible();
    const treeNodes = treePanel.locator("div.space-y-1");
    const beforeCount = await treeNodes.count();
    await expandBtn.click();
    await expect
      .poll(() => treeNodes.count(), {
        message: "Expected tree node count to increase after expand",
      })
      .toBeGreaterThan(beforeCount);

    await expect(treeNodes.first()).toBeVisible();

    await expandBtn.click();
    await expect
      .poll(() => treeNodes.count(), {
        message: "Expected tree node count to return after collapse",
      })
      .toBe(beforeCount);
  });

  test("should navigate using breadcrumb when viewing child organization", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, defaultTestType);

    const organizationCards = getOrgCards(page, defaultTestType);
    const firstCard = organizationCards.first();
    await expect(firstCard).toBeVisible();
    const orgName = (
      await firstCard.getByRole("heading").first().innerText()
    ).trim();
    expect(orgName.length).toBeGreaterThan(0);

    const seeDetailsLink = firstCard.getByRole("link", {
      name: /see details/i,
    });
    await expect(seeDetailsLink).toBeVisible();
    await clickAndWaitForUrl(
      page,
      new RegExp(`.*\\/admin\\/organizations\\/${defaultTestType}\\/[^/]+$`),
      () => seeDetailsLink.click(),
    );

    const breadcrumb = page.locator('[data-slot="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    const organizationsLink = breadcrumb.getByRole("button", {
      name: /organizations/i,
    });
    await expect(organizationsLink).toBeVisible();
    await expect(breadcrumb.getByText(orgName)).toBeVisible();

    await clickAndWaitForUrl(
      page,
      new RegExp(`.*\\/admin\\/organizations\\/${defaultTestType}$`),
      () => organizationsLink.click(),
    );
    await expect(getSearchInput(page)).toBeVisible();
  });

  test("should open create organization sheet from organization detail", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, defaultTestType);

    const organizationCards = getOrgCards(page, defaultTestType);
    const firstCard = organizationCards.first();
    await expect(firstCard).toBeVisible();
    const seeDetailsLink = firstCard.getByRole("link", {
      name: /see details/i,
    });
    await expect(seeDetailsLink).toBeVisible();
    await clickAndWaitForUrl(
      page,
      new RegExp(`.*\\/admin\\/organizations\\/${defaultTestType}\\/[^/]+$`),
      () => seeDetailsLink.click(),
    );

    const addOrgButton = page.getByRole("button", {
      name: /add organization/i,
    });
    await expect(addOrgButton).toBeVisible();
    await addOrgButton.click();

    await expect(
      page.getByRole("dialog").getByText(/create department\/team/i),
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("textbox", {
        name: /name/i,
      }),
    ).toBeVisible();
    const submitButton = page.getByRole("dialog").getByRole("button", {
      name: /create organization/i,
    });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });
});
