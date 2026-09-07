import type { Page } from "@playwright/test";
import { devices, expect, test } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

function sidebar(page: Page) {
  return page.locator('[data-sidebar="sidebar"]');
}

function sidebarToggle(page: Page) {
  return page
    .getByRole("button", {
      name: "Toggle Sidebar",
      exact: true,
      includeHidden: true,
    })
    .and(page.locator('[data-sidebar="trigger"]:visible'));
}

function sidebarState(page: Page) {
  return page.locator("[data-app-sidebar-pinned]");
}

function mainLeft(page: Page) {
  return page
    .locator("#pages")
    .evaluate((element) => element.getBoundingClientRect().left);
}

test.describe("Shared workspace navigation", () => {
  let facilityPath: string;

  test.beforeEach(async ({ page, context, baseURL }) => {
    facilityPath = `/facility/${getFacilityId()}`;
    await context.addCookies([
      { name: "sidebar:state", value: "true", url: baseURL! },
    ]);
    await page.addInitScript(() => {
      for (const name of ["Patients", "Billing", "RBAC", "Organizations"]) {
        localStorage.removeItem(`nav-expansion-state--${name}`);
      }
    });

    const updateNotice = page.locator("li[data-sonner-toast]").filter({
      hasText: "Software Update",
    });
    await page.addLocatorHandler(updateNotice, async (notice) => {
      await notice
        .getByRole("button", { name: "Close toast", exact: true })
        .click();
    });
  });

  test("facility navigation preserves grouped destinations and selects nested pages", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const navigation = sidebar(page);

    await test.step("the facility workspace keeps its existing links", async () => {
      await page.goto(`${facilityPath}/overview`);
      await expect(
        navigation.locator('[data-sidebar="group-label"]'),
      ).toHaveText(["Patient Management", "Services", "Administration"]);
      for (const [name, path] of [
        ["Overview", "/overview"],
        ["Appointments", "/appointments"],
        ["Queues", "/queues"],
        ["Services", "/services"],
        ["Resource", "/resource"],
        ["Users", "/users"],
        ["Settings", "/settings/general"],
      ]) {
        await expect(
          navigation.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", `${facilityPath}${path}`);
      }
      await expect(
        navigation.getByRole("link", { name: "Overview", exact: true }),
      ).toHaveAttribute("aria-current", "page");

      await navigation
        .getByRole("button", { name: "Patients", exact: true })
        .click();
      await expect(
        navigation.getByRole("link", { name: "Search patients", exact: true }),
      ).toHaveAttribute("href", `${facilityPath}/patients`);
      await expect(
        navigation.getByRole("link", { name: "Locations", exact: true }),
      ).toHaveAttribute("href", `${facilityPath}/encounters/locations`);
    });

    await test.step("the header facility selector keeps every available facility and dashboard link", async () => {
      const response = await request.get(
        `${apiBaseUrl()}/api/v1/users/getcurrentuser/`,
        {
          headers: adminApiHeaders(),
        },
      );
      expect(response.ok()).toBe(true);
      const { facilities } = (await response.json()) as {
        facilities: { id: string; name: string }[];
      };
      const selectedFacility = facilities.find(
        (facility) => facilityPath === `/facility/${facility.id}`,
      )!;
      const header = page.locator("[data-cui-app-header]");
      const selector = header.getByRole("button", {
        name: selectedFacility.name,
        exact: true,
      });
      await expect(selector).toBeVisible();
      await expect(
        navigation.getByRole("button", {
          name: selectedFacility.name,
          exact: true,
        }),
      ).toHaveCount(0);
      await selector.click();
      const menu = page.getByRole("menu");
      await expect(
        menu.getByRole("menuitem", { name: "View Dashboard", exact: true }),
      ).toHaveAttribute("href", "/");
      for (const facility of facilities) {
        await expect(
          menu.getByRole("menuitem", { name: facility.name, exact: true }),
        ).toHaveAttribute("href", `/facility/${facility.id}/overview`);
      }
      await page.keyboard.press("Escape");
      await expect(menu).not.toBeVisible();
      await expect(selector).toBeFocused();
    });

    await test.step("billing selection and direct navigation expand the current section", async () => {
      const billing = navigation.getByRole("button", {
        name: "Billing",
        exact: true,
      });
      await billing.click();
      for (const [name, path] of [
        ["Accounts", "account"],
        ["Invoices", "invoices"],
        ["Payments", "payments"],
      ]) {
        await expect(
          navigation.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", `${facilityPath}/billing/${path}`);
      }
      const invoices = navigation.getByRole("link", {
        name: "Invoices",
        exact: true,
      });
      await invoices.click();
      await expect(page).toHaveURL(`${facilityPath}/billing/invoices`);
      await expect(invoices).toHaveAttribute("aria-current", "page");
      await expect(
        navigation.getByRole("link", { name: "Overview", exact: true }),
      ).not.toHaveAttribute("aria-current", "page");

      await billing.click();
      await expect(billing).toHaveAttribute("aria-expanded", "false");
      await navigation
        .getByRole("link", { name: "Overview", exact: true })
        .click();
      await page.goBack();
      await expect(page).toHaveURL(`${facilityPath}/billing/invoices`);
      await expect(billing).toHaveAttribute("aria-expanded", "true");
      await expect(invoices).toHaveAttribute("aria-current", "page");
      await page.reload();
      await expect(invoices).toHaveAttribute("aria-current", "page");
    });
  });

  test("desktop navigation hides fully, previews without moving content, and pins from the header", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${facilityPath}/billing/invoices`);
    const navigation = sidebar(page);
    const toggle = sidebarToggle(page);
    const state = sidebarState(page);

    await test.step("a closed sidebar previews at full width without shifting the page", async () => {
      await expect(
        navigation.getByRole("link", { name: "Invoices", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await toggle.click();
      await page.mouse.move(900, 700);
      await expect(state).toHaveAttribute("data-app-sidebar-pinned", "false");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(navigation).not.toBeVisible();
      await expect(navigation).not.toBeInViewport();
      const closedLeft = await mainLeft(page);
      await toggle.hover();
      await expect(state).toHaveAttribute("data-app-sidebar-preview", "true");
      await expect(navigation).toBeInViewport({ ratio: 1 });
      await expect(
        navigation.getByRole("link", { name: "Invoices", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await expect(
        navigation.getByRole("button", { name: "Billing", exact: true }),
      ).toHaveAttribute("aria-expanded", "true");
      await expect
        .poll(async () => Math.abs((await mainLeft(page)) - closedLeft))
        .toBeLessThan(1);
      await navigation
        .getByRole("link", { name: "Invoices", exact: true })
        .hover();
      await test.info().attach("desktop-sidebar-preview", {
        body: await page.screenshot({
          path: test.info().outputPath("desktop-sidebar-preview.png"),
          animations: "disabled",
        }),
        contentType: "image/png",
      });

      await page.mouse.move(900, 700);
      await expect(navigation).not.toBeVisible();
      await toggle.hover();
      await expect(navigation).toBeInViewport({ ratio: 1 });
      await page.keyboard.press("Escape");
      await expect(state).toHaveAttribute("data-app-sidebar-preview", "false");
      await expect(navigation).not.toBeVisible();
    });

    await test.step("clicking the preview toggle pins the sidebar and keyboard shortcuts toggle it", async () => {
      const closedLeft = await mainLeft(page);
      await page.mouse.move(900, 700);
      await toggle.hover();
      await expect(navigation).toBeInViewport({ ratio: 1 });
      await toggle.click();
      await page.mouse.move(900, 700);
      await expect(state).toHaveAttribute("data-app-sidebar-pinned", "true");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(navigation).toBeInViewport({ ratio: 1 });
      await expect.poll(() => mainLeft(page)).toBeGreaterThan(closedLeft + 100);
      await page.keyboard.press("Control+b");
      await expect(state).toHaveAttribute("data-app-sidebar-pinned", "false");
      await expect(navigation).not.toBeVisible();
      await page.keyboard.press("Control+b");
      await expect(state).toHaveAttribute("data-app-sidebar-pinned", "true");
      await expect(navigation).toBeInViewport({ ratio: 1 });
    });
  });

  test.describe("macOS keyboard navigation", () => {
    test.use({
      userAgent: devices["Desktop Chrome"].userAgent.replace(
        /\([^)]*\)/,
        "(Macintosh; Intel Mac OS X 14_7_1)",
      ),
    });

    test("Command+B pins and unpins the sidebar", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${facilityPath}/overview`);
      const navigation = sidebar(page);
      const state = sidebarState(page);
      await expect(
        navigation.getByRole("link", { name: "Overview", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Meta+b");
      await expect(state).toHaveAttribute("data-app-sidebar-pinned", "false");
      await expect(navigation).not.toBeVisible();
      await page.keyboard.press("Meta+b");
      await expect(state).toHaveAttribute("data-app-sidebar-pinned", "true");
      await expect(navigation).toBeInViewport({ ratio: 1 });
    });
  });

  test("a dropdown opened from sidebar preview keeps the overlay usable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${facilityPath}/overview`);
    const navigation = sidebar(page);
    const toggle = sidebarToggle(page);
    await toggle.click();
    await page.mouse.move(900, 700);
    await expect(navigation).not.toBeVisible();
    const closedLeft = await mainLeft(page);
    await toggle.hover();
    await expect(navigation).toBeInViewport({ ratio: 1 });
    const userMenu = navigation.locator(
      '[data-sidebar="footer"] button[aria-haspopup="menu"]',
    );
    await userMenu.click();
    const menu = page.getByRole("menu");
    await expect(
      menu.getByRole("menuitem", { name: "Profile", exact: true }),
    ).toBeVisible();
    await menu.hover();
    // Keep the portal open beyond the preview's pointer-leave grace period.
    await page.waitForTimeout(500);
    await expect(navigation).toBeInViewport({ ratio: 1 });
    await expect(sidebarState(page)).toHaveAttribute(
      "data-app-sidebar-preview",
      "true",
    );
    await expect
      .poll(async () => Math.abs((await mainLeft(page)) - closedLeft))
      .toBeLessThan(1);
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible();
    await page.mouse.move(900, 700);
    await page.keyboard.press("Escape");
    await expect(navigation).not.toBeVisible();
    await expect(sidebarState(page)).toHaveAttribute(
      "data-app-sidebar-pinned",
      "false",
    );
  });

  for (const workspace of [
    {
      name: "service",
      endpoint: "healthcare_service",
      route: "services",
      page: "locations",
      query: "limit=1",
    },
    {
      name: "location",
      endpoint: "location",
      route: "locations",
      page: "overview",
      query: "mode=kind&mine=true&limit=1&ordering=sort_index",
    },
  ]) {
    test(`${workspace.name} sidebar preview retains its context picker and Home navigation`, async ({
      page,
      request,
    }) => {
      const apiPath = `/api/v1${facilityPath}/${workspace.endpoint}/`;
      const response = await request.get(
        `${apiBaseUrl()}${apiPath}?${workspace.query}`,
        { headers: adminApiHeaders() },
      );
      expect(response.ok()).toBe(true);
      const { results } = (await response.json()) as {
        results: { id: string; name: string }[];
      };
      expect(
        results.length,
        `An existing ${workspace.name} fixture is required`,
      ).toBeGreaterThan(0);
      const fixture = results[0];
      const workspacePath = `${facilityPath}/${workspace.route}/${fixture.id}/${workspace.page}`;
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(workspacePath);
      const navigation = sidebar(page);
      const header = navigation.locator('[data-sidebar="header"]');
      const picker = header.getByRole("button", {
        name: fixture.name,
        exact: true,
      });
      const home = header.getByRole("button", { name: "Home", exact: true });
      const toggle = sidebarToggle(page);
      const state = sidebarState(page);

      await test.step("hover restores an accessible context header without pinning", async () => {
        await expect(picker).toBeVisible();
        await toggle.click();
        await page.mouse.move(900, 700);
        await expect(navigation).not.toBeVisible();
        await expect(state).toHaveAttribute("data-app-sidebar-pinned", "false");
        const closedLeft = await mainLeft(page);
        await toggle.hover();
        await expect(navigation).toBeInViewport({ ratio: 1 });
        await expect(state).toHaveAttribute("data-app-sidebar-preview", "true");
        await expect(header).not.toHaveAttribute("inert", "");
        await expect(header).not.toHaveAttribute("aria-hidden", "true");
        await expect(header).toBeInViewport({ ratio: 1 });
        await expect(home).toBeVisible();
        await expect(picker).toBeVisible();
        await expect(picker).toHaveAttribute("aria-haspopup", "dialog");
        await expect
          .poll(async () => Math.abs((await mainLeft(page)) - closedLeft))
          .toBeLessThan(1);
        await home.hover();
        await test.info().attach(`${workspace.name}-sidebar-preview`, {
          body: await page.screenshot({
            path: test
              .info()
              .outputPath(`${workspace.name}-sidebar-preview.png`),
            animations: "disabled",
          }),
          contentType: "image/png",
        });
      });

      await test.step("the picker can search in its dialog while the preview stays open", async () => {
        await picker.click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole("heading")).toContainText(fixture.name);
        await dialog.hover();
        const searchResponse = page.waitForResponse((result) => {
          const url = new URL(result.url());
          return (
            url.pathname === apiPath &&
            url.searchParams.get("name") === fixture.name
          );
        });
        await dialog
          .getByPlaceholder("Search", { exact: true })
          .fill(fixture.name);
        expect((await searchResponse).ok()).toBe(true);
        await expect(
          dialog.getByRole("option").filter({ hasText: fixture.name }).first(),
        ).toBeVisible();
        await expect(navigation).toBeInViewport({ ratio: 1 });
        await expect(state).toHaveAttribute("data-app-sidebar-preview", "true");
        await expect(state).toHaveAttribute("data-app-sidebar-pinned", "false");
        await dialog
          .getByRole("button", { name: "Close", exact: true })
          .click();
        await expect(dialog).not.toBeVisible();
        // Closing a dialog leaves the pointer outside the preview; reopen it
        // through the normal hover target before continuing navigation.
        await toggle.hover();
        await expect(navigation).toBeInViewport({ ratio: 1 });
        await home.hover();
        await expect(home).toBeVisible();
        await expect(picker).toBeVisible();
        await expect(state).toHaveAttribute("data-app-sidebar-pinned", "false");
      });

      await test.step("Home returns to the facility overview without pinning the sidebar", async () => {
        await home.click();
        await expect(page).toHaveURL(`${facilityPath}/overview`);
        await expect(state).toHaveAttribute("data-app-sidebar-pinned", "false");
        await expect(navigation).not.toBeVisible();
      });
    });
  }

  test("admin navigation keeps its groups and active links in the full sidebar preview", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/admin/rbac/permissions");
    const navigation = sidebar(page);

    await test.step("admin destinations and the current RBAC child remain available", async () => {
      await expect(
        navigation.locator('[data-sidebar="group-label"]'),
      ).toHaveText(["Configuration", "Administration"]);
      for (const [name, path] of [
        ["Questionnaires", "questionnaires"],
        ["Actions", "actions"],
        ["Valuesets", "valuesets"],
        ["Patient Identifier Config", "patient_identifier_config"],
        ["Tag Config", "tag_config"],
        ["Apps", "apps"],
      ]) {
        await expect(
          navigation.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", `/admin/${path}`);
      }
      await expect(
        navigation.getByRole("button", { name: "RBAC", exact: true }),
      ).toHaveAttribute("aria-expanded", "true");
      await expect(
        navigation.getByRole("link", { name: "Permissions", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await navigation
        .getByRole("link", { name: "Roles", exact: true })
        .click();
      await expect(page).toHaveURL("/admin/rbac/roles");
      await expect(
        navigation.getByRole("link", { name: "Roles", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });

    await test.step("organization groups expand inside the full admin preview", async () => {
      const toggle = sidebarToggle(page);
      await toggle.click();
      await page.mouse.move(900, 700);
      await expect(navigation).not.toBeVisible();
      await toggle.hover();
      await expect(navigation).toBeInViewport({ ratio: 1 });
      const organizations = navigation.getByRole("button", {
        name: "Organizations",
        exact: true,
      });
      await organizations.click();
      for (const [name, path] of [
        ["Governance", "govt"],
        ["Suppliers", "product_supplier"],
        ["Responsibilities", "role"],
      ]) {
        await expect(
          navigation.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", `/admin/organizations/${path}`);
      }
      await page.keyboard.press("Escape");
      await expect(navigation).not.toBeVisible();
    });
  });

  test("mobile navigation expands groups and closes after selecting a new or current page", async ({
    page,
    context,
    baseURL,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // An unpinned desktop preference must still open the complete mobile drawer.
    await context.addCookies([
      { name: "sidebar:state", value: "false", url: baseURL! },
    ]);
    await page.goto(`${facilityPath}/overview`);
    const drawer = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
    const toggle = sidebarToggle(page);

    await test.step("the drawer expands groups inline and closes on navigation", async () => {
      await expect(drawer).not.toBeVisible();
      await toggle.click();
      await expect(drawer).toBeVisible();
      await expect(drawer).toBeInViewport({ ratio: 1 });
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await test.info().attach("mobile-sidebar-drawer", {
        body: await page.screenshot({
          path: test.info().outputPath("mobile-sidebar-drawer.png"),
          animations: "disabled",
        }),
        contentType: "image/png",
      });
      await drawer
        .getByRole("button", { name: "Billing", exact: true })
        .click();
      await drawer.getByRole("link", { name: "Invoices", exact: true }).click();
      await expect(page).toHaveURL(`${facilityPath}/billing/invoices`);
      await expect(drawer).not.toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    });

    await test.step("selecting the current destination dismisses the drawer too", async () => {
      await toggle.click();
      const currentPage = drawer.getByRole("link", {
        name: "Invoices",
        exact: true,
      });
      await expect(currentPage).toHaveAttribute("aria-current", "page");
      await currentPage.click();
      await expect(drawer).not.toBeVisible();
      await expect(page).toHaveURL(`${facilityPath}/billing/invoices`);
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    });
  });

  test("permission-hidden facility destinations stay absent when pinned and previewed", async ({
    page,
  }) => {
    // Restrict read responses in this browser only; no role or fixture is changed.
    await page.route("**/api/v1/users/getcurrentuser/", async (route) => {
      const response = await route.fetch();
      const user = await response.json();
      await route.fulfill({ response, json: { ...user, is_superuser: false } });
    });
    await page.route(`**/api/v1${facilityPath}/`, async (route) => {
      const response = await route.fetch();
      const facility = await response.json();
      const hiddenPermissions = new Set([
        "can_list_booking",
        "can_write_booking",
        "can_list_encounter",
        "can_create_encounter",
      ]);
      await route.fulfill({
        response,
        json: {
          ...facility,
          permissions: (facility.permissions as string[]).filter(
            (permission) => !hiddenPermissions.has(permission),
          ),
        },
      });
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${facilityPath}/overview`);
    const navigation = sidebar(page);
    await expect(
      navigation.getByRole("link", { name: "Overview", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    for (const state of ["pinned", "preview"]) {
      await test.step(`${state} navigation respects facility permissions`, async () => {
        if (state === "preview") {
          const toggle = sidebarToggle(page);
          await toggle.click();
          await page.mouse.move(900, 700);
          await expect(navigation).not.toBeVisible();
          await toggle.hover();
          await expect(navigation).toBeInViewport({ ratio: 1 });
        }
        await expect(
          navigation
            .locator('[data-sidebar="group-label"]')
            .filter({ hasText: "Patient Management" }),
        ).toHaveCount(0);
        await expect(
          navigation.getByRole("link", { name: "Appointments", exact: true }),
        ).toHaveCount(0);
        await expect(
          navigation.getByRole("link", { name: "Queues", exact: true }),
        ).toHaveCount(0);
        await expect(
          navigation.getByRole("button", { name: "Patients", exact: true }),
        ).toHaveCount(0);
        await expect(
          navigation.getByRole("link", { name: "Settings", exact: true }),
        ).toBeVisible();
      });
    }
  });
});
