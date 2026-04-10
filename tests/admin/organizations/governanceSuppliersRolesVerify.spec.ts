import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

// `ORGANIZATION_TYPES` drives navigation + list smoke for all three admin org UIs.
// Deeper flows (search, tree expand/collapse, breadcrumb from detail, open child-org sheet)
// intentionally use `DEFAULT_ORG_TYPE` (`govt`) only: hierarchical cards + See details exist there, not on flat role/supplier layouts.
const ORGANIZATION_TYPES = ["govt", "product_supplier", "role"] as const;
type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

const DEFAULT_ORG_TYPE: OrganizationType = "govt";
const MD_VIEWPORT_MIN = 768;

const GOVT_SEARCH_PLACEHOLDER = "Search by department/team name";
const EMPTY_LIST_TEXT = "No Organizations Found";

function isFlatOrgType(type: OrganizationType) {
  return type === "role" || type === "product_supplier";
}

function typeHeadingPattern(type: OrganizationType) {
  if (type === "govt") return /gov(?:t|ernance|erence)/i;
  if (type === "product_supplier") return /^suppliers$/i;
  return /responsibilit/i;
}

function searchInput(page: Page, type: OrganizationType) {
  if (isFlatOrgType(type)) {
    return page.getByRole("textbox", { name: /^search$/i });
  }
  return page.getByRole("textbox", { name: GOVT_SEARCH_PLACEHOLDER });
}

function govtOrgCards(page: Page) {
  return page
    .getByRole("heading", { name: typeHeadingPattern("govt") })
    .locator("../..")
    .locator('[data-slot="card"]')
    .filter({ hasNot: page.getByText(EMPTY_LIST_TEXT) });
}

function firstResizablePanel(page: Page) {
  return page.locator('[data-slot="resizable-panel"]').first();
}

function adminOrgListUrlRegex(type: OrganizationType) {
  return new RegExp(`.*\\/admin\\/organizations\\/${type}$`);
}

function adminOrgDetailUrlRegex(type: OrganizationType) {
  return new RegExp(`.*\\/admin\\/organizations\\/${type}\\/[^/]+$`);
}

async function gotoOrgTypeList(page: Page, type: OrganizationType) {
  await page.goto(`/admin/organizations/${type}`);
  await expect(searchInput(page, type)).toBeVisible();
}

async function clickAndWaitForUrl(
  page: Page,
  urlPattern: RegExp,
  clickAction: () => Promise<void>,
) {
  await Promise.all([page.waitForURL(urlPattern), clickAction()]);
  await expect(firstResizablePanel(page)).toBeVisible();
}

function seeDetailsLinkInCard(card: Locator) {
  return card.getByRole("link", { name: /see details/i });
}

async function openFirstGovtOrgDetail(page: Page, type: OrganizationType) {
  const firstCard = govtOrgCards(page).first();
  await expect(firstCard).toBeVisible();
  const link = seeDetailsLinkInCard(firstCard);
  await expect(link).toBeVisible();
  await clickAndWaitForUrl(page, adminOrgDetailUrlRegex(type), () =>
    link.click(),
  );
}

test.describe("Admin organization lists", () => {
  let hasSeededGovtOrgCard = false;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    hasSeededGovtOrgCard = await govtOrgCards(page)
      .first()
      .isVisible()
      .catch(() => false);
    await context.close();
  });

  function skipIfNoGovtOrgCards() {
    if (!hasSeededGovtOrgCard) {
      test.skip(
        true,
        `need at least one ${DEFAULT_ORG_TYPE} org card (fixtures / seed data)`,
      );
    }
  }

  test("should open govt, suppliers, and responsibilities list routes", async ({
    page,
  }) => {
    for (const type of ORGANIZATION_TYPES) {
      await gotoOrgTypeList(page, type);
      await expect(page).toHaveURL(adminOrgListUrlRegex(type));
      await expect(
        page.getByRole("heading", { name: typeHeadingPattern(type) }),
      ).toBeVisible();
      await expect(searchInput(page, type)).toBeVisible();
    }
  });

  test("should show govt cards or flat sidebar rows per org type", async ({
    page,
  }) => {
    for (const type of ORGANIZATION_TYPES) {
      await gotoOrgTypeList(page, type);
      const emptyState = page.getByText(EMPTY_LIST_TEXT);

      if (type === "govt") {
        const cards = govtOrgCards(page);
        const firstCard = cards.first();
        await expect(firstCard.or(emptyState)).toBeVisible();
        if ((await cards.count()) > 0) {
          await expect(firstCard.getByRole("heading")).toBeVisible();
          await expect(seeDetailsLinkInCard(firstCard)).toBeVisible();
        }
        continue;
      }

      const sidebar = firstResizablePanel(page);
      const orgRow = sidebar.getByRole("button").first();
      await expect(orgRow.or(emptyState)).toBeVisible();

      const createCta =
        type === "role"
          ? page.getByRole("button", { name: /create responsibility/i })
          : page.getByRole("button", { name: /add organization/i });
      await expect(createCta).toBeVisible();
    }
  });

  test("should open govt org detail from see details", async ({ page }) => {
    skipIfNoGovtOrgCards();
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openFirstGovtOrgDetail(page, DEFAULT_ORG_TYPE);
    await expect(page.locator('[data-slot="breadcrumb"]')).toBeVisible();
  });

  test("should filter govt org cards when searching by name", async ({
    page,
  }) => {
    skipIfNoGovtOrgCards();
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);

    const cards = govtOrgCards(page);
    await expect(cards.first()).toBeVisible();

    const initialCount = await cards.count();
    const input = searchInput(page, DEFAULT_ORG_TYPE);
    await expect(input).toBeVisible();

    const firstCard = cards.first();
    const firstOrgName = (
      await firstCard.getByRole("heading").first().innerText()
    ).trim();
    expect(firstOrgName.length).toBeGreaterThan(0);

    if (initialCount >= 2) {
      await input.fill(firstOrgName);
      await expect(
        page.getByText(firstOrgName, { exact: true }).first(),
      ).toBeVisible();
      const filteredCards = govtOrgCards(page);
      const filteredCount = await filteredCards.count();
      expect(filteredCount).toBeGreaterThan(0);
      for (let i = 0; i < filteredCount; i += 1) {
        const headingText = (
          await filteredCards.nth(i).getByRole("heading").first().innerText()
        ).trim();
        expect(headingText.toLowerCase()).toContain(firstOrgName.toLowerCase());
      }
      await input.clear();
      await expect(govtOrgCards(page).first()).toBeVisible();
      return;
    }

    // One root org: exact name still shows the card; nonsense clears the list; clear restores.
    await input.fill(firstOrgName);
    await expect(govtOrgCards(page).first()).toBeVisible();
    await input.fill(`zz_${faker.string.uuid()}`);
    await expect(page.getByText(EMPTY_LIST_TEXT)).toBeVisible();
    await input.clear();
    await expect(govtOrgCards(page).first()).toBeVisible();
  });

  test("should show empty state when govt search has no matches", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    const input = searchInput(page, DEFAULT_ORG_TYPE);
    await expect(input).toBeVisible();

    await input.fill(`NonExistent_${faker.string.uuid()}`);
    await expect(page.getByText(EMPTY_LIST_TEXT)).toBeVisible();
  });

  test("should expand and collapse govt organization tree", async ({
    page,
  }) => {
    skipIfNoGovtOrgCards();
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);

    const viewport = page.viewportSize();
    if (!viewport || viewport.width < MD_VIEWPORT_MIN) {
      test.skip(true, `Tree hidden below ${MD_VIEWPORT_MIN}px width`);
      return;
    }

    const treePanel = firstResizablePanel(page);
    await expect(treePanel).toBeVisible();
    await expect(treePanel.locator("div.space-y-1").first()).toBeVisible();

    // Chevron expand only exists when API reports has_children (see AdminOrganizationNavbar).
    const expandButtons = treePanel
      .getByRole("button")
      .filter({ has: treePanel.locator("svg") });
    if ((await expandButtons.count()) === 0) {
      test.skip(
        true,
        "No expandable govt orgs in tree (leaf nodes use a spacer, not a button)",
      );
      return;
    }

    const expandBtn = expandButtons.first();
    await expect(expandBtn).toBeVisible();
    const treeNodes = treePanel.locator("div.space-y-1");
    const beforeCount = await treeNodes.count();
    await expandBtn.click();
    await expect
      .poll(() => treeNodes.count(), { message: "tree should grow on expand" })
      .toBeGreaterThan(beforeCount);

    await expect(treeNodes.first()).toBeVisible();

    await expandBtn.click();
    await expect
      .poll(() => treeNodes.count(), {
        message: "tree should shrink on collapse",
      })
      .toBe(beforeCount);
  });

  test("should return to govt list via breadcrumb Organizations control", async ({
    page,
  }) => {
    skipIfNoGovtOrgCards();
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);

    const firstCard = govtOrgCards(page).first();
    await expect(firstCard).toBeVisible();
    const orgName = (
      await firstCard.getByRole("heading").first().innerText()
    ).trim();
    expect(orgName.length).toBeGreaterThan(0);

    await openFirstGovtOrgDetail(page, DEFAULT_ORG_TYPE);

    const breadcrumb = page.locator('[data-slot="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    const organizationsLink = breadcrumb.getByRole("button", {
      name: /organizations/i,
    });
    await expect(organizationsLink).toBeVisible();
    await expect(breadcrumb.getByText(orgName)).toBeVisible();

    await clickAndWaitForUrl(page, adminOrgListUrlRegex(DEFAULT_ORG_TYPE), () =>
      organizationsLink.click(),
    );
    await expect(searchInput(page, DEFAULT_ORG_TYPE)).toBeVisible();
  });

  test("should open add organization sheet from govt org detail", async ({
    page,
  }) => {
    skipIfNoGovtOrgCards();
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openFirstGovtOrgDetail(page, DEFAULT_ORG_TYPE);

    const addOrgButton = page.getByRole("button", {
      name: /add organization/i,
    });
    await expect(addOrgButton).toBeVisible();
    await addOrgButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/create department\/team/i)).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: /name/i })).toBeVisible();

    const submitButton = dialog.getByRole("button", {
      name: /create organization/i,
    });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });
});
