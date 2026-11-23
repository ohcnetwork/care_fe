import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import {
  mockTestPlugin,
  testPluginRemoteEntryUrl,
} from "tests/helper/testPlugin";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/** TanStack Router keeps its history index in `history.state`. */
function historyIndex(page: Page) {
  return page.evaluate(
    () => (window.history.state as { __TSR_index?: number })?.__TSR_index,
  );
}

function settingsBreadcrumb(page: Page) {
  return page
    .locator('[data-cy="facility-settings-page-header"]')
    .getByRole("navigation", { name: "breadcrumb" });
}

test.describe("TanStack Router navigation", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test("billing settings redirect preserves search and hash", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/settings/billing?x=1#discounts`);

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/billing/discount_codes?x=1#discounts`,
    );
  });

  test("back after a direct open falls back to the parent route", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/settings/devices/create`);
    await expect(
      page.getByRole("textbox", { name: "Registered Name *" }),
    ).toBeVisible();
    expect(await historyIndex(page)).toBe(0);

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/devices$`),
    );
    await expect(page.getByRole("link", { name: "Add Device" })).toBeVisible();
  });

  test("back after a reload returns to the previous in-app page", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/settings/devices`);
    await page.getByRole("link", { name: "Add Device" }).click();
    await expect(page).toHaveURL(/\/settings\/devices\/create$/);
    expect(await historyIndex(page)).toBe(1);

    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "Registered Name *" }),
    ).toBeVisible();
    expect(await historyIndex(page)).toBe(1);

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/devices$`),
    );
    expect(await historyIndex(page)).toBe(0);
  });

  test("breadcrumbs on a deep settings page come from the matched routes", async ({
    page,
    request,
  }) => {
    const deviceName = `${faker.commerce.productName()} ${Date.now()}`;
    const response = await request.post(
      `${apiBaseUrl()}/api/v1/facility/${facilityId}/device/`,
      {
        headers: adminApiHeaders(),
        data: {
          registered_name: deviceName,
          status: "active",
          availability_status: "available",
        },
      },
    );
    expect(response.ok()).toBe(true);
    const device = (await response.json()) as { id: string };

    await page.goto(`/facility/${facilityId}/settings/devices/${device.id}`);

    const breadcrumb = settingsBreadcrumb(page);
    await expect(
      breadcrumb.getByRole("link", { name: "Settings", exact: true }),
    ).toHaveAttribute("href", `/facility/${facilityId}/settings`);
    await expect(
      breadcrumb.getByRole("link", { name: "Devices", exact: true }),
    ).toHaveAttribute("href", `/facility/${facilityId}/settings/devices`);
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      deviceName,
    );

    await breadcrumb
      .getByRole("link", { name: "Devices", exact: true })
      .click();
    await expect(page).toHaveURL(/\/settings\/devices$/);
    await expect(page.getByRole("link", { name: "Add Device" })).toBeVisible();
  });

  test("unsaved changes prompt blocks browser back until confirmed", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/settings/valuesets`);
    await page.getByRole("link", { name: "Create ValueSet" }).click();
    await expect(page).toHaveURL(/\/settings\/valuesets\/create$/);
    await page
      .getByRole("textbox", { name: "Name *" })
      .fill(faker.lorem.words(2));

    let prompt = "";
    page.once("dialog", (dialog) => {
      prompt = dialog.message();
      void dialog.dismiss();
    });
    await page.goBack().catch(() => undefined);
    await expect
      .poll(() => prompt)
      .toBe("You have unsaved changes. Leave without saving?");
    await expect(page).toHaveURL(/\/settings\/valuesets\/create$/);
    await expect(page.getByRole("textbox", { name: "Name *" })).toBeVisible();

    page.once("dialog", (dialog) => void dialog.accept());
    await page.goBack();
    await expect(page).toHaveURL(/\/settings\/valuesets$/);
  });

  test("plugin route deep link works on a cold load and after a reload", async ({
    page,
  }) => {
    await mockTestPlugin(page);

    await page.goto("/test-plugin/items/42");
    await expect(page.locator('[data-cy="test-plugin-page"]')).toHaveText(
      "Test plugin item 42",
    );

    await page.reload();
    await expect(page.locator('[data-cy="test-plugin-page"]')).toHaveText(
      "Test plugin item 42",
    );

    // Core routes keep precedence over plugin routes.
    await page.goto(`/facility/${facilityId}/settings/general`);
    await expect(
      settingsBreadcrumb(page).locator('[aria-current="page"]'),
    ).toHaveText("General");
  });

  test("a plugin uses the host router through the shared module", async ({
    page,
  }) => {
    await mockTestPlugin(page);

    await page.goto("/test-plugin/router");
    const routerPage = page.locator('[data-cy="test-plugin-router"]');
    await expect(routerPage).toHaveText("/test-plugin/router");

    await routerPage.click();
    await expect(page).toHaveURL(/\/test-plugin\/items\/7$/);
    await expect(page.locator('[data-cy="test-plugin-page"]')).toHaveText(
      "Test plugin item 7",
    );

    await page.goBack();
    await expect(routerPage).toHaveText("/test-plugin/router");
  });

  test("typed links keep commas in comma-separated id params", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/settings/general`);
    await page.waitForFunction(() => "__TSR_ROUTER__" in window);

    const hrefs = await page.evaluate(() => {
      const router = (
        window as unknown as {
          __TSR_ROUTER__: {
            buildLocation: (options: {
              to: string;
              params: Record<string, string>;
            }) => { href: string };
          };
        }
      ).__TSR_ROUTER__;
      return [
        router.buildLocation({
          to: "/facility/$facilityId/billing/invoices/$invoiceIds/print",
          params: { facilityId: "f", invoiceIds: "a,b" },
        }).href,
        router.buildLocation({
          to: "/users/$username",
          params: { username: "a/b" },
        }).href,
      ];
    });

    // Legacy links write raw commas; typed links must give the same URL.
    expect(hrefs).toEqual([
      "/facility/f/billing/invoices/a,b/print",
      "/users/a%2Fb",
    ]);
  });

  test("a plugin that fails to load shows not found for its routes", async ({
    page,
  }) => {
    await mockTestPlugin(page);
    await page.route(testPluginRemoteEntryUrl, (route) => route.abort());

    await page.goto("/test-plugin/items/42");
    await expect(
      page.getByRole("heading", { name: "Page Not Found" }),
    ).toBeVisible();
  });
});
