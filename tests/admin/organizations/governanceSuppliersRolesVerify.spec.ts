import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const ORGANIZATION_TYPES = ["govt", "product_supplier", "role"] as const;
type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

const DEFAULT_ORG_TYPE: OrganizationType = "govt";
const MD_VIEWPORT_MIN = 768;

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
  return page.getByRole("textbox", { name: /search by department/i });
}

function govtOrgCards(page: Page) {
  return page
    .locator('[data-slot="card"]')
    .filter({ hasNot: page.getByText(/no organizations found/i) });
}

function govtOrgCard(page: Page, orgName: string) {
  return govtOrgCards(page).filter({
    has: page.getByRole("heading", { name: orgName, exact: true }),
  });
}

async function createGovtOrganization(page: Page, orgName: string) {
  await page.getByRole("button", { name: /add organization/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: /name/i }).fill(orgName);
  await dialog.getByRole("button", { name: /create organization/i }).click();
  await expect(dialog).not.toBeVisible();
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
  await page.goto(`/admin/organizations/${type}`, {
    waitUntil: "networkidle",
  });
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

async function openGovtOrgDetailByName(
  page: Page,
  orgName: string,
  type: OrganizationType,
) {
  await searchInput(page, type).fill(orgName);
  const card = govtOrgCard(page, orgName);
  await expect(card).toBeVisible();
  const link = seeDetailsLinkInCard(card);
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  const detailUrl = new URL(href!, page.url()).href;
  await Promise.all([page.waitForURL(detailUrl), link.click()]);
  await expect(page).toHaveURL(detailUrl);
  await expect(
    page.getByRole("heading", { name: orgName, exact: true }),
  ).toBeVisible();
  return detailUrl;
}

test.describe("Admin organization lists", () => {
  let parentOrgName: string;
  let createdOrgName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    try {
      const page = await context.newPage();
      await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
      createdOrgName = `Root ${faker.string.uuid()}`;
      parentOrgName = createdOrgName;
      await createGovtOrganization(page, createdOrgName);
    } finally {
      await context.close();
    }
  });

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

      if (type === "govt") {
        await searchInput(page, type).fill(parentOrgName);
        const parentCard = govtOrgCard(page, parentOrgName);
        await expect(parentCard).toBeVisible();
        await expect(parentCard.getByRole("heading")).toBeVisible();
        await expect(seeDetailsLinkInCard(parentCard)).toBeVisible();
        continue;
      }

      const sidebar = firstResizablePanel(page);
      const orgRow = sidebar.getByRole("button").first();
      const emptyState = page.getByText(/no organizations found/i);
      await expect(orgRow.or(emptyState)).toBeVisible();

      const createCta =
        type === "role"
          ? page.getByRole("button", { name: /create responsibility/i })
          : page.getByRole("button", { name: /add organization/i });
      await expect(createCta).toBeVisible();
    }
  });

  test("should open govt org detail via see details", async ({ page }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openGovtOrgDetailByName(page, parentOrgName, DEFAULT_ORG_TYPE);
    await expect(page.locator('[data-slot="breadcrumb"]')).toBeVisible();
  });

  test("should filter govt org cards when searching by name", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);

    const input = searchInput(page, DEFAULT_ORG_TYPE);
    await expect(input).toBeVisible();

    await input.fill(createdOrgName);
    const matchedCard = govtOrgCards(page).filter({
      has: page.getByRole("heading", { name: createdOrgName }),
    });
    await expect(matchedCard).toBeVisible();

    const filteredCards = govtOrgCards(page);
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBeGreaterThan(0);
    for (let i = 0; i < filteredCount; i += 1) {
      const headingText = (
        await filteredCards.nth(i).getByRole("heading").first().innerText()
      ).trim();
      expect(headingText.toLowerCase()).toContain(createdOrgName.toLowerCase());
    }

    await input.fill(`zz_${faker.string.uuid()}`);
    await expect(page.getByText(/no organizations found/i)).toBeVisible();

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
    await expect(page.getByText(/no organizations found/i)).toBeVisible();
  });

  test("should expand and collapse govt organization tree", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);

    const viewport = page.viewportSize();
    if (!viewport || viewport.width < MD_VIEWPORT_MIN) {
      test.skip(true, `Tree panel hidden below ${MD_VIEWPORT_MIN}px width`);
      return;
    }

    const treePanel = firstResizablePanel(page);
    await expect(treePanel).toBeVisible();

    const expandButtons = treePanel.getByRole("button");
    const expandCount = await expandButtons.count();
    if (expandCount === 0) {
      test.skip(true, "No expandable orgs in tree (all nodes are leaf nodes)");
      return;
    }

    const expandBtn = expandButtons.first();
    await expect(expandBtn).toBeVisible();

    const beforeText = (await treePanel.innerText()).length;
    await expandBtn.click();
    await expect
      .poll(async () => (await treePanel.innerText()).length, {
        message: "tree content should grow on expand",
      })
      .toBeGreaterThan(beforeText);

    await expandBtn.click();
    await expect
      .poll(async () => (await treePanel.innerText()).length, {
        message: "tree content should shrink on collapse",
      })
      .toBe(beforeText);
  });

  test("should return to govt list via breadcrumb Organizations control", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openGovtOrgDetailByName(page, parentOrgName, DEFAULT_ORG_TYPE);

    const breadcrumb = page.locator('[data-slot="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    const organizationsLink = breadcrumb.getByRole("button", {
      name: /organizations/i,
    });
    await expect(organizationsLink).toBeVisible();
    await expect(breadcrumb.getByText(parentOrgName)).toBeVisible();

    await clickAndWaitForUrl(page, adminOrgListUrlRegex(DEFAULT_ORG_TYPE), () =>
      organizationsLink.click(),
    );
    await expect(searchInput(page, DEFAULT_ORG_TYPE)).toBeVisible();
  });

  test("should open add organization sheet from govt org detail", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openGovtOrgDetailByName(page, parentOrgName, DEFAULT_ORG_TYPE);

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

  test("should create a root organization accessible from the govt list", async ({
    page,
  }) => {
    const rootName = `Root ${faker.string.uuid()}`;

    await test.step("Create a root from the organization list", async () => {
      await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
      await createGovtOrganization(page, rootName);
    });

    await test.step("Reload and verify root navigation has no ancestor", async () => {
      await page.reload();
      await openGovtOrgDetailByName(page, rootName, DEFAULT_ORG_TYPE);
      const breadcrumb = page.locator('[data-slot="breadcrumb"]');
      await expect(breadcrumb.getByRole("button")).toHaveCount(1);
      await expect(
        breadcrumb.getByRole("button", { name: /^organizations$/i }),
      ).toBeVisible();
      await expect(
        breadcrumb.getByText(rootName, { exact: true }),
      ).toBeVisible();
    });
  });

  test("should create a child under the selected govt organization", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    const parentUrl = await openGovtOrgDetailByName(
      page,
      createdOrgName,
      DEFAULT_ORG_TYPE,
    );
    const parentId = new URL(parentUrl).pathname.split("/").pop();
    const childName = `Child ${faker.string.uuid()}`;

    await test.step("Create the child using the parent API field", async () => {
      const responsePromise = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/v1/organization/" &&
          response.request().method() === "POST" &&
          response.request().postDataJSON()?.name === childName,
      );
      await createGovtOrganization(page, childName);
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
      const payload = response.request().postDataJSON();
      expect(payload).toMatchObject({ parent: parentId });
      expect(payload).not.toHaveProperty("parent_id");
    });

    await test.step("Reload and open the child from its parent's listing", async () => {
      await page.reload();
      await expect(govtOrgCard(page, childName)).toBeVisible();
      await openGovtOrgDetailByName(page, childName, DEFAULT_ORG_TYPE);
    });

    await test.step("Navigate back through the exact parent breadcrumb", async () => {
      await page.reload();
      const breadcrumb = page.locator('[data-slot="breadcrumb"]');
      await expect(
        breadcrumb.getByText(childName, { exact: true }),
      ).toBeVisible();
      const parentButton = breadcrumb.getByRole("button", {
        name: createdOrgName,
        exact: true,
      });
      await expect(parentButton).toBeVisible();
      await Promise.all([page.waitForURL(parentUrl), parentButton.click()]);
      await expect(page).toHaveURL(parentUrl);
      await expect(govtOrgCard(page, childName)).toBeVisible();
    });
  });

  test("should preserve the parent when editing a child organization", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    const parentUrl = await openGovtOrgDetailByName(
      page,
      createdOrgName,
      DEFAULT_ORG_TYPE,
    );
    const childName = `Child ${faker.string.uuid()}`;
    const updatedName = `Updated ${faker.string.uuid()}`;

    await test.step("Create an independent child fixture", async () => {
      await createGovtOrganization(page, childName);
      await page.reload();
      await expect(govtOrgCard(page, childName)).toBeVisible();
    });

    await test.step("Edit the child from the parent's listing", async () => {
      await govtOrgCard(page, childName)
        .getByRole("button", { name: /^edit$/i })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: /name/i }).fill(updatedName);
      await dialog
        .getByRole("button", { name: /update organization/i })
        .click();
      await expect(dialog).not.toBeVisible();
    });

    await test.step("Reload and verify the renamed child still belongs to the parent", async () => {
      await page.reload();
      await expect(govtOrgCard(page, updatedName)).toBeVisible();
      await expect(govtOrgCard(page, childName)).toHaveCount(0);
      await openGovtOrgDetailByName(page, updatedName, DEFAULT_ORG_TYPE);
      await page.reload();
      const parentButton = page
        .locator('[data-slot="breadcrumb"]')
        .getByRole("button", { name: createdOrgName, exact: true });
      await expect(parentButton).toBeVisible();
      await Promise.all([page.waitForURL(parentUrl), parentButton.click()]);
      await expect(page).toHaveURL(parentUrl);
      await expect(govtOrgCard(page, updatedName)).toBeVisible();
    });
  });

  test("should create a role organization without a parent", async ({
    page,
  }) => {
    const roleName = `Role ${faker.string.uuid()}`;

    await test.step("Create a responsibility from the role list", async () => {
      await gotoOrgTypeList(page, "role");
      await page
        .getByRole("button", { name: /create responsibility/i })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: /name/i }).fill(roleName);
      await dialog
        .getByRole("button", { name: /create responsibility/i })
        .click();
      await expect(dialog).not.toBeVisible();
    });

    await test.step("Reload and open the responsibility from the top-level list", async () => {
      await page.reload();
      await searchInput(page, "role").fill(roleName);
      const roleButton = firstResizablePanel(page).getByRole("button", {
        name: roleName,
        exact: true,
      });
      await expect(roleButton).toBeVisible();
      await clickAndWaitForUrl(page, adminOrgDetailUrlRegex("role"), () =>
        roleButton.click(),
      );
      await expect(
        page.getByRole("heading", { name: roleName, exact: true }),
      ).toBeVisible();
    });
  });
});
