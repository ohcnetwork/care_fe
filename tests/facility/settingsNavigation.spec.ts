import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const SETTINGS_DESTINATIONS = [
  ["General", "/settings/general"],
  ["Departments", "/settings/departments"],
  ["Questionnaires", "/settings/questionnaires"],
  ["ValueSets", "/settings/valuesets"],
  ["Locations", "/settings/locations"],
  ["Devices", "/settings/devices"],
  ["Specimen Definitions", "/settings/specimen_definitions"],
  ["Observation Definitions", "/settings/observation_definitions"],
  ["Activity Definitions", "/settings/activity_definitions"],
  ["Charge Item Definitions", "/settings/charge_item_definitions"],
  ["Healthcare Services", "/settings/healthcare_services"],
  ["Product Knowledge", "/settings/product_knowledge"],
  ["Product", "/settings/product"],
  ["Token Category", "/settings/token_category"],
  ["Patient Identifier Config", "/settings/patient_identifier_config"],
  ["Tag config", "/settings/tag_config"],
  ["Templates", "/template"],
  ["Responses", "/settings/responses"],
] as const;

function settingsHeader(page: Page) {
  return page.locator('[data-cy="facility-settings-page-header"]');
}

async function expectCurrentSettingsPage(page: Page, title: string) {
  const breadcrumb = settingsHeader(page).getByRole("navigation", {
    name: "breadcrumb",
  });
  await expect(
    breadcrumb.getByRole("link", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(title);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
}

test.describe("Facility settings navigation", () => {
  let facilityPath: string;
  let facilityName: string;

  test.beforeEach(async ({ page, context, request, baseURL }) => {
    const facilityId = getFacilityId();
    facilityPath = `/facility/${facilityId}`;
    const response = await request.get(
      `${apiBaseUrl()}/api/v1/facility/${facilityId}/`,
      { headers: adminApiHeaders() },
    );
    expect(response.ok()).toBe(true);
    facilityName = ((await response.json()) as { name: string }).name;

    await context.addCookies([
      { name: "sidebar:state", value: "true", url: baseURL! },
    ]);

    // A preview rebuilt since authentication can show this persistent notice
    // over the mobile header. Dismiss it through its regular UI.
    const updateNotice = page.locator("li[data-sonner-toast]").filter({
      hasText: "Software Update",
    });
    await page.addLocatorHandler(updateNotice, async (notice) => {
      await notice
        .getByRole("button", { name: "Close toast", exact: true })
        .click();
    });
  });

  test("opens a dedicated settings sidebar and preserves it across deep routes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const sidebar = page.locator('[data-sidebar="sidebar"]');

    await test.step("Settings is a direct link from the facility workspace", async () => {
      await page.goto(`${facilityPath}/overview`);
      const settingsLink = sidebar.getByRole("link", {
        name: "Settings",
        exact: true,
      });
      await expect(settingsLink).toHaveAttribute(
        "href",
        `${facilityPath}/settings/general`,
      );
      await expect(
        sidebar.getByRole("button", { name: "Settings", exact: true }),
      ).toHaveCount(0);
      await settingsLink.click();
      await expect(page).toHaveURL(`${facilityPath}/settings/general`);
      await expectCurrentSettingsPage(page, "General");

      const breadcrumb = settingsHeader(page).getByRole("navigation", {
        name: "breadcrumb",
      });
      await expect(
        breadcrumb.getByRole("link", { name: facilityName, exact: true }),
      ).toHaveAttribute("href", `${facilityPath}/overview`);

      for (const [name, path] of SETTINGS_DESTINATIONS) {
        await expect(
          sidebar.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", `${facilityPath}${path}`);
      }
      await expect(
        sidebar.getByRole("button", { name: "Billing", exact: true }),
      ).toBeVisible();
      for (const path of [
        "/appointments",
        "/queues",
        "/patients",
        "/services",
        "/resource",
        "/users",
        "/billing/invoices",
      ]) {
        await expect(
          sidebar.locator(`a[href="${facilityPath}${path}"]`),
        ).toHaveCount(0);
      }
      await expect(
        sidebar.getByRole("link", { name: "General", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });

    await test.step("General provides quick links and a Responses entry point", async () => {
      const quickLinks = page.getByRole("region", {
        name: "Quick links",
        exact: true,
      });
      for (const [name, path] of [
        ["Departments", "departments"],
        ["Locations", "locations"],
        ["Devices", "devices"],
        ["Healthcare Services", "healthcare_services"],
        ["Product", "product"],
        ["Questionnaires", "questionnaires"],
      ]) {
        await expect(
          quickLinks.getByRole("link", { name, exact: true }),
        ).toHaveAttribute("href", `${facilityPath}/settings/${path}`);
      }
      const forms = page.locator('[data-cy="facility-forms"]');
      await expect(
        forms.getByRole("button", { name: /^Submit forms/ }),
      ).toBeVisible();
      await forms.getByRole("link", { name: /^Responses/ }).click();
      await expect(page).toHaveURL(`${facilityPath}/settings/responses`);
      await expectCurrentSettingsPage(page, "Responses");
      await expect(
        sidebar.getByRole("link", { name: "Responses", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await sidebar.getByRole("link", { name: "General", exact: true }).click();
      await expectCurrentSettingsPage(page, "General");
    });

    await test.step("collapsed settings controls retain usable accessible names", async () => {
      const toggle = settingsHeader(page).getByRole("button", {
        name: "Toggle Sidebar",
        exact: true,
      });
      const container = page.locator('[data-side="left"][data-collapsible]');
      await toggle.click();
      await expect(container).toHaveAttribute("data-state", "collapsed");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(
        sidebar.getByRole("link", { name: "General", exact: true }),
      ).toBeVisible();
      await expect(
        sidebar.getByRole("link", { name: "Back to facility", exact: true }),
      ).toBeVisible();
      const billing = sidebar.getByRole("button", {
        name: "Billing",
        exact: true,
      });
      await billing.click();
      const menu = page.getByRole("dialog", { name: "Billing", exact: true });
      await expect(
        menu.getByRole("link", { name: "Tax Codes", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).not.toBeVisible();
      await expect(billing).toBeFocused();
      await toggle.click();
      await expect(container).toHaveAttribute("data-state", "expanded");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
    });

    await test.step("billing pages and reload retain the selected setting", async () => {
      const billing = sidebar.getByRole("button", {
        name: "Billing",
        exact: true,
      });
      if ((await billing.getAttribute("aria-expanded")) !== "true") {
        await billing.click();
      }
      for (const path of [
        "discount_codes",
        "discount_components",
        "discount_configuration",
        "tax_codes",
        "tax_components",
        "informational_codes",
        "settings",
      ]) {
        await expect(
          sidebar.locator(`a[href="${facilityPath}/settings/billing/${path}"]`),
        ).toHaveCount(1);
      }
      await sidebar
        .getByRole("link", { name: "Discount Codes", exact: true })
        .click();
      await expect(page).toHaveURL(
        `${facilityPath}/settings/billing/discount_codes`,
      );
      await expectCurrentSettingsPage(page, "Discount Codes");
      await sidebar
        .getByRole("link", { name: "Tax Codes", exact: true })
        .click();
      await expect(page).toHaveURL(
        `${facilityPath}/settings/billing/tax_codes`,
      );
      await expectCurrentSettingsPage(page, "Tax Codes");
      await expect(
        sidebar.getByRole("link", { name: "Tax Codes", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await expect(
        sidebar.getByRole("link", { name: "General", exact: true }),
      ).not.toHaveAttribute("aria-current", "page");
      await page.reload();
      await expectCurrentSettingsPage(page, "Tax Codes");
      await expect(
        sidebar.getByRole("link", { name: "Tax Codes", exact: true }),
      ).toHaveAttribute("aria-current", "page");
    });

    await test.step("Templates stays in settings and Back to facility restores the workspace", async () => {
      await sidebar
        .getByRole("link", { name: "Templates", exact: true })
        .click();
      await expect(page).toHaveURL(`${facilityPath}/template`);
      await expectCurrentSettingsPage(page, "Templates");
      await expect(
        sidebar.getByRole("link", { name: "Templates", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await page.reload();
      await expectCurrentSettingsPage(page, "Templates");
      await sidebar
        .getByRole("link", { name: "Back to facility", exact: true })
        .click();
      await expect(page).toHaveURL(`${facilityPath}/overview`);
      await expect(settingsHeader(page)).toHaveCount(0);
      await expect(
        sidebar.getByRole("link", { name: "Appointments", exact: true }),
      ).toBeVisible();
      await expect(
        sidebar.getByRole("link", { name: "Settings", exact: true }),
      ).toBeVisible();
    });
  });

  test("a failed background refresh preserves an open facility editor and unsaved changes", async ({
    page,
    request,
  }) => {
    await page.goto(`${facilityPath}/settings/general`);
    const edit = page.getByRole("button", {
      name: "Edit Facility Details",
      exact: true,
    });
    await expect(edit).toBeVisible();
    const endpoint = `/api/v1${facilityPath}/`;
    let releaseFailure = () => {};
    const failureGate = new Promise<void>((resolve) => {
      releaseFailure = resolve;
    });
    await page.route(`**${endpoint}`, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await failureGate;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Temporary test refresh failure" }),
      });
    });

    try {
      const failedResponse = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === endpoint &&
          response.status() === 503,
      );
      await edit.click();
      const editor = page.getByRole("dialog", {
        name: "Edit Facility",
        exact: true,
      });
      const name = editor.getByRole("textbox", { name: "Facility Name" });
      await expect(name).toHaveValue(facilityName);
      const unsavedName = `Unsaved facility edit ${Date.now()}`;
      await name.fill(unsavedName);
      releaseFailure();
      await failedResponse;
      await expect(
        page.getByText(
          "Unable to refresh facility details. Please try again.",
          {
            exact: true,
          },
        ),
      ).toBeVisible();
      await expect(editor).toBeVisible();
      await expect(name).toHaveValue(unsavedName);
      await editor.getByRole("button", { name: "Close", exact: true }).click();
      await expect(editor).not.toBeVisible();
    } finally {
      releaseFailure();
      await page.unroute(`**${endpoint}`);
    }

    const savedFacility = await request.get(`${apiBaseUrl()}${endpoint}`, {
      headers: adminApiHeaders(),
    });
    expect(savedFacility.ok()).toBe(true);
    expect(((await savedFacility.json()) as { name: string }).name).toBe(
      facilityName,
    );
  });

  test("mobile settings navigation closes after selection and survives a deep-link reload", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${facilityPath}/settings`);
    await expect(page).toHaveURL(`${facilityPath}/settings/general`);
    await expectCurrentSettingsPage(page, "General");
    const toggle = settingsHeader(page).getByRole("button", {
      name: "Toggle Sidebar",
      exact: true,
    });
    const drawer = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');

    await test.step("the drawer selects a billing page and closes", async () => {
      await expect(drawer).not.toBeVisible();
      await toggle.click();
      await expect(drawer).toBeVisible();
      await expect(
        drawer.getByRole("link", { name: "General", exact: true }),
      ).toHaveAttribute("aria-current", "page");
      await drawer
        .getByRole("button", { name: "Billing", exact: true })
        .click();
      await drawer
        .getByRole("link", { name: "Tax Codes", exact: true })
        .click();
      await expect(drawer).not.toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page).toHaveURL(
        `${facilityPath}/settings/billing/tax_codes`,
      );
      await expectCurrentSettingsPage(page, "Tax Codes");
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(390);
    });

    await test.step("reload and selecting the current page preserve the route", async () => {
      await page.reload();
      await expectCurrentSettingsPage(page, "Tax Codes");
      await toggle.click();
      await expect(drawer).toBeVisible();
      const currentPage = drawer.getByRole("link", {
        name: "Tax Codes",
        exact: true,
      });
      await expect(currentPage).toHaveAttribute("aria-current", "page");
      await currentPage.click();
      await expect(drawer).not.toBeVisible();
      await expect(page).toHaveURL(
        `${facilityPath}/settings/billing/tax_codes`,
      );
      await toggle.click();
      await drawer
        .getByRole("link", { name: "Back to facility", exact: true })
        .click();
      await expect(drawer).not.toBeVisible();
      await expect(page).toHaveURL(`${facilityPath}/overview`);
      await expect(settingsHeader(page)).toHaveCount(0);
    });
  });
});
