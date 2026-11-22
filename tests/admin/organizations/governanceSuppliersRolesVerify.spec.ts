import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const ORGANIZATION_TYPES = ["govt", "product_supplier", "role"] as const;
type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

const DEFAULT_ORG_TYPE: OrganizationType = "govt";

function isFlatOrgType(type: OrganizationType) {
  return type === "role" || type === "product_supplier";
}

function typeHeadingPattern(type: OrganizationType) {
  if (type === "govt") return /gov(?:t|ernance|erence)/i;
  if (type === "product_supplier") return /^suppliers$/i;
  // Anchored so it doesn't also match the detail panel's nested
  // "What responsibilities can X manage?" section heading.
  return /^responsibilities$/i;
}

function searchInput(page: Page, type: OrganizationType) {
  if (type === "role") {
    return page.getByRole("textbox", { name: /search responsibilities/i });
  }
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

async function createGovtOrganization(
  page: Page,
  orgName: string,
  parent = false,
) {
  const buttons = page.getByRole("button", { name: /add organization/i });
  await (parent ? buttons.last() : buttons.first()).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: /name/i }).fill(orgName);
  await dialog.getByRole("button", { name: /create organization/i }).click();
  await expect(dialog).not.toBeVisible();
}

async function checkGovtChildSheetValidation(page: Page) {
  const addOrgButton = page
    .getByRole("button", { name: /add organization/i })
    .last();
  await expect(addOrgButton).toBeVisible();
  await addOrgButton.click();

  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: /add organization/i }),
  ).toBeVisible();
  const nameInput = dialog.getByRole("textbox", { name: /name/i });
  await expect(nameInput).toBeVisible();

  const submitButton = dialog.getByRole("button", {
    name: /create organization/i,
  });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeDisabled();
  await nameInput.fill("   ");
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await expect(nameInput).toHaveAttribute("aria-invalid", "true");
  await dialog.getByRole("button", { name: /^close$/i }).click();
  await expect(dialog).not.toBeVisible();
}

function governanceTree(page: Page) {
  return page.locator("aside").filter({ has: page.getByRole("combobox") });
}

function adminOrgListUrlRegex(type: OrganizationType) {
  if (type === "role") {
    // Responsibilities auto-selects and redirects to the first responsibility's
    // detail route on wide screens, so the list URL may carry a trailing id.
    return new RegExp(`.*\\/admin\\/organizations\\/role(\\/[^/]+)?$`);
  }
  return new RegExp(`.*\\/admin\\/organizations\\/${type}$`);
}

function adminOrgDetailUrlRegex(type: OrganizationType) {
  return new RegExp(`.*\\/admin\\/organizations\\/${type}\\/[^/]+$`);
}

async function gotoOrgTypeList(page: Page, type: OrganizationType) {
  await page.goto(`/admin/organizations/${type}`, {
    waitUntil: "networkidle",
  });
  await expect(
    type === "govt"
      ? governanceTree(page).getByRole("combobox")
      : searchInput(page, type),
  ).toBeVisible();
}

async function clickAndWaitForUrl(
  page: Page,
  urlPattern: RegExp,
  clickAction: () => Promise<void>,
) {
  await clickAction();
  await expect(page).toHaveURL(urlPattern);
  await expect(governanceTree(page)).toBeVisible();
}

function seeDetailsLinkInCard(card: Locator) {
  return card.getByRole("link", { name: /see details/i });
}

async function openGovtOrgDetailByName(
  page: Page,
  orgName: string,
  type: OrganizationType,
) {
  if (/\/admin\/organizations\/govt\/?$/.test(new URL(page.url()).pathname)) {
    await governanceTree(page).getByRole("combobox").click();
    await page.getByRole("combobox", { name: /^search$/i }).fill(orgName);
    await page.getByRole("option", { name: orgName, exact: true }).click();
  } else {
    await searchInput(page, type).fill(orgName);
    const card = govtOrgCard(page, orgName);
    await expect(card).toBeVisible();
    const link = seeDetailsLinkInCard(card);
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    const detailUrl = new URL(href!, page.url()).href;
    await link.click();
    await expect(page).toHaveURL(detailUrl);
  }
  await expect(page).toHaveURL(adminOrgDetailUrlRegex(type));
  await expect(
    page.getByRole("heading", { name: orgName, exact: true }),
  ).toBeVisible();
  return page.url();
}

test.describe("Organization directory compatibility", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("care_access_token", "supplier-directory-test");
    });
    await page.route(
      (url) => url.pathname.startsWith("/api/"),
      async (route) => {
        const { pathname } = new URL(route.request().url());
        if (pathname === "/api/v1/users/getcurrentuser/") {
          await route.fulfill({
            json: {
              id: "00000000-0000-4000-8000-000000000001",
              username: "test",
              first_name: "Test",
              last_name: "User",
              user_type: "administrator",
              is_superuser: true,
              permissions: [],
              facilities: [],
              organizations: [],
              preferences: {},
              flags: [],
            },
          });
        } else if (pathname === "/api/v1/plug_config/") {
          await route.fulfill({ json: { configs: [] } });
        } else if (route.request().method() === "GET") {
          await route.fulfill({ json: { count: 0, results: [] } });
        } else {
          await route.abort();
        }
      },
    );
  });

  test("redirects legacy supplier detail URLs to the directory", async ({
    page,
  }) => {
    await page.goto(
      `/admin/organizations/product_supplier/${faker.string.uuid()}`,
    );
    await expect(page).toHaveURL(/\/admin\/organizations\/product_supplier\/?$/);
    await expect(
      page.getByRole("heading", { name: /^suppliers$/i }),
    ).toBeVisible();
  });

  test("loads more suppliers and retries a failed page", async ({ page }) => {
    const suppliers = Array.from({ length: 25 }, (_, index) => ({
      id: faker.string.uuid(),
      name:
        index === 24
          ? "A later supplier"
          : `Supplier ${String(index).padStart(2, "0")}`,
      org_type: "product_supplier",
    }));
    let failNextPage = true;

    await page.route("**/api/v1/organization/**", async (route) => {
      const url = new URL(route.request().url());
      if (
        url.pathname !== "/api/v1/organization/" ||
        url.searchParams.get("org_type") !== "product_supplier"
      ) {
        await route.fallback();
        return;
      }

      const offset = Number(url.searchParams.get("offset") || 0);
      const limit = Number(url.searchParams.get("limit") || 20);
      if (offset > 0 && failNextPage) {
        await route.fulfill({ status: 503, json: { detail: "Unavailable" } });
        return;
      }
      await route.fulfill({
        json: {
          count: suppliers.length,
          results: suppliers.slice(offset, offset + limit),
        },
      });
    });

    await page.goto("/admin/organizations/product_supplier");
    await page
      .getByText("Supplier 19", { exact: true })
      .scrollIntoViewIfNeeded();
    const error = page.getByRole("alert").filter({
      has: page.getByRole("button", { name: /retry/i }),
    });
    await expect(error).toBeVisible();
    failNextPage = false;
    await error.getByRole("button", { name: /retry/i }).click();
    await expect(
      page.getByText("A later supplier", { exact: true }),
    ).toBeVisible();
    await expect(page.locator('[data-slot="supplier-row"] h2')).toHaveText(
      suppliers.map((supplier) => supplier.name),
    );
  });

  test("opens governance detail using the redesigned picker", async ({
    page,
  }) => {
    const root = {
      id: faker.string.uuid(),
      name: "Governance test root",
      org_type: "govt",
      parent: null,
      permissions: [],
      has_children: false,
    };
    await page.route("**/api/v1/organization/**", async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === `/api/v1/organization/${root.id}/`) {
        await route.fulfill({ json: root });
      } else if (url.pathname === "/api/v1/organization/") {
        const isRootList = url.searchParams.get("parent") !== root.id;
        const matches = root.name
          .toLowerCase()
          .includes((url.searchParams.get("name") || "").toLowerCase());
        const results = isRootList && matches ? [root] : [];
        await route.fulfill({ json: { count: results.length, results } });
      } else {
        await route.fallback();
      }
    });

    await gotoOrgTypeList(page, "govt");
    await openGovtOrgDetailByName(page, root.name, "govt");
    await expect(searchInput(page, "govt")).toBeVisible();
    await expect(page.getByText(/no organizations found/i)).toBeVisible();

    const request = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        url.pathname === "/api/v1/organization/" &&
        url.searchParams.get("parent") === root.id &&
        url.searchParams.get("name") === "saved search"
      );
    });
    await searchInput(page, "govt").fill("saved search");
    await request;
    await expect(page).toHaveURL(/search=saved(\+|%20)search/);
    await page.reload();
    await expect(searchInput(page, "govt")).toHaveValue("saved search");
  });

  test("creates and edits a child in the governance workspace", async ({
    page,
  }) => {
    const root = {
      id: faker.string.uuid(),
      name: "Governance test root",
      org_type: "govt",
      parent: null,
      permissions: [],
      has_children: false,
    };
    let child: {
      id: string;
      name: string;
      org_type: string;
      parent: typeof root;
      permissions: string[];
      has_children: boolean;
    } | undefined;

    await page.route("**/api/v1/organization/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === "POST") {
        const payload = request.postDataJSON();
        expect(payload.parent).toBe(root.id);
        child = {
          id: faker.string.uuid(),
          name: payload.name,
          org_type: "govt",
          parent: root,
          permissions: [],
          has_children: false,
        };
        root.has_children = true;
        await route.fulfill({ json: child });
      } else if (request.method() === "PUT" && child) {
        child.name = request.postDataJSON().name;
        await route.fulfill({ json: child });
      } else if (url.pathname === `/api/v1/organization/${root.id}/`) {
        await route.fulfill({ json: root });
      } else if (child && url.pathname === `/api/v1/organization/${child.id}/`) {
        await route.fulfill({ json: child });
      } else if (url.pathname === "/api/v1/organization/") {
        const candidates =
          url.searchParams.get("parent") === root.id ? [child] : [root];
        const name = (url.searchParams.get("name") || "").toLowerCase();
        const results = candidates.filter(
          (org) => org && org.name.toLowerCase().includes(name),
        );
        await route.fulfill({ json: { count: results.length, results } });
      } else {
        await route.fallback();
      }
    });

    await gotoOrgTypeList(page, "govt");
    const parentUrl = await openGovtOrgDetailByName(page, root.name, "govt");
    await checkGovtChildSheetValidation(page);
    await createGovtOrganization(page, "Child organization", true);
    const tree = governanceTree(page);
    await tree.getByRole("button", { name: `Expand ${root.name}` }).click();
    await expect(
      tree.getByRole("button", { name: "Child organization" }),
    ).toBeVisible();
    await tree.getByRole("button", { name: `Collapse ${root.name}` }).click();
    await expect(
      tree.getByRole("button", { name: "Child organization" }),
    ).toHaveCount(0);
    const card = govtOrgCard(page, "Child organization");
    await expect(seeDetailsLinkInCard(card)).toBeVisible();
    await card.getByRole("button", { name: /^edit$/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: /name/i }).fill("Updated child");
    await dialog.getByRole("button", { name: /update organization/i }).click();
    await expect(dialog).not.toBeVisible();
    await openGovtOrgDetailByName(page, "Updated child", "govt");
    await page
      .locator('[data-slot="breadcrumb"]')
      .getByRole("button", { name: root.name })
      .click();
    await expect(page).toHaveURL(parentUrl);
    await expect(govtOrgCard(page, "Updated child")).toBeVisible();
  });
});

test.describe("Admin organization lists", () => {
  let rootOrgName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    try {
      const page = await context.newPage();
      await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
      rootOrgName = `Root ${faker.string.uuid()}`;
      await createGovtOrganization(page, rootOrgName);
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
      if (type !== "govt") await expect(searchInput(page, type)).toBeVisible();
    }
  });

  test("should show govt cards or flat sidebar rows per org type", async ({
    page,
  }) => {
    for (const type of ORGANIZATION_TYPES) {
      await gotoOrgTypeList(page, type);

      if (type === "govt") {
        await openGovtOrgDetailByName(page, rootOrgName, type);
        await expect(searchInput(page, type)).toBeVisible();
        const childName = `Card child ${faker.string.uuid()}`;
        await createGovtOrganization(page, childName, true);
        const childCard = govtOrgCard(page, childName);
        await expect(childCard).toBeVisible();
        await expect(childCard.getByRole("heading")).toBeVisible();
        await expect(seeDetailsLinkInCard(childCard)).toBeVisible();
        continue;
      }

      if (type === "role") {
        const orgRow = page
          .locator('[data-slot="responsibility-list"]')
          .locator('[data-slot="responsibility-row"]')
          .first();
        const emptyState = page.getByText(/no organizations found/i);
        await expect(orgRow.or(emptyState)).toBeVisible();
        await expect(
          page.getByRole("button", { name: /new responsibility/i }),
        ).toBeVisible();
        continue;
      }

      const orgRow = page.locator('[data-slot="supplier-row"]').first();
      const emptyState = page.getByText(/no organizations found/i);
      await expect(orgRow.or(emptyState)).toBeVisible();

      const createCta = page.getByRole("button", { name: /add organization/i });
      await expect(createCta).toBeVisible();
      await expect(
        page.getByRole("link", { name: /referrals|referral availability/i }),
      ).toHaveCount(0);
    }
  });

  test("should create and edit suppliers from the flat directory", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, "product_supplier");

    const name = faker.company.name();
    const updatedName = `${name} updated`;
    const description = faker.lorem.sentence();

    await page.getByRole("button", { name: /add organization/i }).click();
    const createDialog = page.getByRole("dialog");
    await createDialog.getByRole("textbox", { name: /name/i }).fill(name);
    await createDialog
      .getByRole("textbox", { name: /description/i })
      .fill(description);
    await createDialog
      .getByRole("button", { name: /create organization/i })
      .click();

    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText(/organization created successfully/i),
    ).toBeVisible();

    await searchInput(page, "product_supplier").fill(name);
    const supplierRow = page
      .locator('[data-slot="supplier-row"]')
      .filter({ hasText: name });
    await expect(supplierRow).toBeVisible();
    await expect(supplierRow.getByText(description)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /referrals|referral availability/i }),
    ).toHaveCount(0);

    await supplierRow.getByRole("button", { name: /^edit$/i }).click();
    const editDialog = page.getByRole("dialog");
    const nameInput = editDialog.getByRole("textbox", { name: /name/i });
    await expect(nameInput).toHaveValue(name);
    await nameInput.fill(updatedName);
    await editDialog
      .getByRole("button", { name: /update organization/i })
      .click();

    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText(/organizations updated successfully/i),
    ).toBeVisible();
    await searchInput(page, "product_supplier").fill(updatedName);
    await expect(
      page.locator('[data-slot="supplier-row"]').filter({
        hasText: updatedName,
      }),
    ).toBeVisible();
  });

  test("should open govt org detail via see details", async ({ page }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openGovtOrgDetailByName(page, rootOrgName, DEFAULT_ORG_TYPE);
    await expect(page.locator('[data-slot="breadcrumb"]')).toBeVisible();
  });

  test("should filter child organization cards when searching by name", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openGovtOrgDetailByName(page, rootOrgName, DEFAULT_ORG_TYPE);
    const childName = `Search child ${faker.string.uuid()}`;
    await createGovtOrganization(page, childName, true);

    const input = searchInput(page, DEFAULT_ORG_TYPE);
    await expect(input).toBeVisible();

    await input.fill(childName);
    const matchedCard = govtOrgCards(page).filter({
      has: page.getByRole("heading", { name: childName }),
    });
    await expect(matchedCard).toBeVisible();

    const filteredCards = govtOrgCards(page);
    const filteredCount = await filteredCards.count();
    expect(filteredCount).toBeGreaterThan(0);
    for (let i = 0; i < filteredCount; i += 1) {
      const headingText = (
        await filteredCards.nth(i).getByRole("heading").first().innerText()
      ).trim();
      expect(headingText.toLowerCase()).toContain(childName.toLowerCase());
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
    await openGovtOrgDetailByName(page, rootOrgName, DEFAULT_ORG_TYPE);
    const input = searchInput(page, DEFAULT_ORG_TYPE);
    await expect(input).toBeVisible();

    await input.fill(`NonExistent_${faker.string.uuid()}`);
    await expect(page.getByText(/no organizations found/i)).toBeVisible();
  });

  test("should expand and collapse govt organization tree", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    const treePanel = governanceTree(page);
    const firstOrganization = treePanel.locator("button[aria-pressed]").first();
    await expect(firstOrganization).toBeVisible();
    const organizationName = (await firstOrganization.innerText()).trim();
    await firstOrganization.click();
    await expect(
      page.getByRole("heading", { name: organizationName, exact: true }),
    ).toBeVisible();
    const childName = `Tree child ${faker.string.uuid()}`;
    await createGovtOrganization(page, childName, true);

    await expect(treePanel).toBeVisible();
    const expander = treePanel.getByRole("button", {
      name: `Expand ${organizationName}`,
      exact: true,
    });
    const collapse = treePanel.getByRole("button", {
      name: `Collapse ${organizationName}`,
      exact: true,
    });
    await expect(expander.or(collapse)).toBeVisible();
    if (await collapse.isVisible()) await collapse.click();
    await expander.click();
    await expect(
      treePanel.getByRole("button", { name: childName }),
    ).toBeVisible();
    await collapse.click();
    await expect(
      treePanel.getByRole("button", { name: childName }),
    ).toHaveCount(0);
  });

  test("should return to govt list via breadcrumb Organizations control", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openGovtOrgDetailByName(page, rootOrgName, DEFAULT_ORG_TYPE);

    const breadcrumb = page.locator('[data-slot="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    const organizationsLink = breadcrumb.getByRole("button", {
      name: /organizations/i,
    });
    await expect(organizationsLink).toBeVisible();
    await expect(breadcrumb.getByText(rootOrgName)).toBeVisible();

    await clickAndWaitForUrl(page, adminOrgListUrlRegex(DEFAULT_ORG_TYPE), () =>
      organizationsLink.click(),
    );
    await expect(governanceTree(page).getByRole("combobox")).toBeVisible();
  });

  test("should open add organization sheet from govt org detail", async ({
    page,
  }) => {
    await gotoOrgTypeList(page, DEFAULT_ORG_TYPE);
    await openGovtOrgDetailByName(page, rootOrgName, DEFAULT_ORG_TYPE);

    await checkGovtChildSheetValidation(page);
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
      rootOrgName,
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
      await createGovtOrganization(page, childName, true);
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
        name: rootOrgName,
        exact: true,
      });
      await expect(parentButton).toBeVisible();
      await parentButton.click();
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
      rootOrgName,
      DEFAULT_ORG_TYPE,
    );
    const childName = `Child ${faker.string.uuid()}`;
    const updatedName = `Updated ${faker.string.uuid()}`;

    await test.step("Create an independent child fixture", async () => {
      await createGovtOrganization(page, childName, true);
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
        .getByRole("button", { name: rootOrgName, exact: true });
      await expect(parentButton).toBeVisible();
      await parentButton.click();
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
      await page.getByRole("button", { name: /new responsibility/i }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: /title/i }).fill(roleName);
      const responsePromise = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === "/api/v1/organization/" &&
          response.request().method() === "POST" &&
          response.request().postDataJSON()?.name === roleName,
      );
      await dialog.getByRole("button", { name: /^create$/i }).click();
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
      expect(response.request().postDataJSON()).not.toHaveProperty("parent");
      await expect(dialog).not.toBeVisible();
    });

    await test.step("Reload and open the responsibility from the top-level list", async () => {
      await page.reload();
      await searchInput(page, "role").fill(roleName);
      const roleButton = page
        .locator('[data-slot="responsibility-row"]')
        .filter({ hasText: roleName });
      await expect(roleButton).toBeVisible();
      await roleButton.click();
      await expect(page).toHaveURL(adminOrgDetailUrlRegex("role"));
      await expect(
        page.getByRole("heading", { name: roleName, exact: true }),
      ).toBeVisible();
    });
  });
});
