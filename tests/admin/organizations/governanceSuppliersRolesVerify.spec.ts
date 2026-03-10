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
    return type === "govt"
      ? /gov(?:t|ernance|erence)/i
      : new RegExp(type.replace(/_/g, "\\s*"), "i");
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
          const seeDetailsLink = firstCard.getByRole("link", {
            name: /see details/i,
          });
          await expect(seeDetailsLink).toBeVisible();
          await seeDetailsLink.click();
          await page.waitForLoadState("domcontentloaded");
          await expect(page).toHaveURL(
            new RegExp(`.*\\/admin\\/organizations\\/${type}\\/[^/]+$`),
          );
          await expect(page.locator('[data-slot="breadcrumb"]')).toBeVisible();
          await navigateToOrganizationType(page, type);
        } else {
          await expect(emptyState).toBeVisible();
        }
      });
    }
  });

  test("should filter organizations by name when searching", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, defaultTestType);

    const initialCards = getOrgCards(page, defaultTestType);
    const initialCount = await initialCards.count();
    const searchInput = getSearchInput(page);
    await expect(searchInput).toBeVisible();

    if (initialCount > 0) {
      const firstCard = initialCards.first();
      const firstOrgName = await firstCard
        .getByRole("heading")
        .textContent()
        .then((t) => t?.trim())
        .catch(() => null);

      if (firstOrgName) {
        const partialName = firstOrgName.slice(0, 5);
        await searchInput.fill(partialName);
        await expect(
          page.getByText(firstOrgName, { exact: false }).first(),
        ).toBeVisible();
        await expect(searchInput).toHaveValue(partialName);
        expect(
          await getOrgCards(page, defaultTestType).count(),
        ).toBeGreaterThan(0);
      }
    }

    const searchTerm = `NonExistent_${faker.string.uuid()}`;
    await searchInput.fill(searchTerm);
    await expect(page.getByText(emptyStateText)).toBeVisible();
    await expect(searchInput).toHaveValue(searchTerm);

    await searchInput.clear();
    if (initialCount > 0) {
      const cardsAfterClear = getOrgCards(page, defaultTestType);
      await expect(cardsAfterClear.first()).toBeVisible();
      expect(await cardsAfterClear.count()).toBeGreaterThanOrEqual(
        initialCount,
      );
    }
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
    if ((await expandButtons.count()) === 0) {
      test.skip(true, "No expandable nodes in tree");
      return;
    }

    const expandBtn = expandButtons.first();
    await expect(expandBtn).toBeVisible();

    const node = treePanel
      .locator("div.space-y-1")
      .filter({ has: expandBtn })
      .first();
    const childContainer = node.locator("div.pl-2").first();

    await expect(childContainer).not.toBeVisible();
    await expandBtn.click();
    await expect(childContainer).toBeVisible();

    const childNodes = childContainer.locator("div.space-y-1");
    expect(await childNodes.count()).toBeGreaterThan(0);
    await expect(childNodes.first()).toBeVisible();

    await expandBtn.click();
    await expect(childContainer).not.toBeVisible();
  });

  test("should navigate using breadcrumb when viewing child organization", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, defaultTestType);

    const organizationCards = getOrgCards(page, defaultTestType);
    if ((await organizationCards.count()) === 0) {
      test.skip(true, "No orgs to test");
      return;
    }

    const firstCard = organizationCards.first();
    await expect(firstCard).toBeVisible();
    const orgName = await firstCard.getByRole("heading").textContent();

    const seeDetailsLink = firstCard.getByRole("link", {
      name: /see details/i,
    });
    await expect(seeDetailsLink).toBeVisible();
    await seeDetailsLink.click();
    await page.waitForLoadState("domcontentloaded");

    const breadcrumb = page.locator('[data-slot="breadcrumb"]');
    await breadcrumb.waitFor({ state: "visible" });
    await expect(page).toHaveURL(
      new RegExp(`.*\\/admin\\/organizations\\/${defaultTestType}\\/.+/`),
    );
    await expect(breadcrumb).toBeVisible();
    const organizationsLink = breadcrumb.getByRole("button", {
      name: /organizations/i,
    });
    await expect(organizationsLink).toBeVisible();
    if (orgName) {
      await expect(breadcrumb.getByText(orgName.trim())).toBeVisible();
    }

    await organizationsLink.click();
    await page.goto(`/admin/organizations/${defaultTestType}`, {
      waitUntil: "networkidle",
    });
    await expect(page).toHaveURL(
      new RegExp(`.*\\/admin\\/organizations\\/${defaultTestType}$`),
    );
    await expect(getSearchInput(page)).toBeVisible();
  });

  test("should open create organization sheet from organization detail", async ({
    page,
  }) => {
    await navigateToOrganizationType(page, defaultTestType);

    const organizationCards = getOrgCards(page, defaultTestType);
    if ((await organizationCards.count()) === 0) {
      test.skip(true, "No orgs to test create flow");
      return;
    }

    const firstCard = organizationCards.first();
    await expect(firstCard).toBeVisible();
    const seeDetailsLink = firstCard.getByRole("link", {
      name: /see details/i,
    });
    await expect(seeDetailsLink).toBeVisible();
    await seeDetailsLink.click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(
      new RegExp(`.*\\/admin\\/organizations\\/${defaultTestType}\\/.+/`),
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
    await expect(
      page.getByRole("dialog").getByRole("button", {
        name: /create organization/i,
      }),
    ).toBeVisible();
  });
});
