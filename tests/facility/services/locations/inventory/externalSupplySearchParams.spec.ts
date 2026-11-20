import { expect, test, type Page } from "@playwright/test";
import {
  openServiceLocation,
  recordRequestUrls,
  waitForListRequest,
} from "tests/facility/services/helpers";
import { filterSelectButton } from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The purchase orders and inward entries of a location read their query
// strings with typed search schemas (`src/lib/router/search/inventory.ts`).
// `tab` holds the statuses of the selected tab, and the delivery form reads
// the request order it fills from `supplyOrder`.

const REQUEST_ORDERS = "/order/request/";
const DELIVERY_ORDERS = "/order/delivery/";
const ALL_COMPLETED = "completed,abandoned,entered_in_error";

let pharmacyPath: string;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
  });
  const page = await context.newPage();
  pharmacyPath = await openServiceLocation(
    page,
    getFacilityId(),
    "Main Pharmacy",
    "Pharmacy",
  );
  await context.close();
});

const tab = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true });

async function expectSelectedTab(page: Page, name: string) {
  await expect(tab(page, name)).toHaveAttribute("aria-selected", "true");
}

test.describe("Purchase order list search params", () => {
  const ordersUrl = (search = "") =>
    `${pharmacyPath}/inventory/external/orders/outgoing${search}`;

  test("writes the selected tab to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(ordersUrl());
    await expectSelectedTab(page, "Requested");

    const request = waitForListRequest(
      page,
      REQUEST_ORDERS,
      (params) => params.get("status") === ALL_COMPLETED,
    );
    await tab(page, "Completed").click();
    await request;

    await expect(page).toHaveURL(
      /[?&]tab=completed%2Cabandoned%2Centered_in_error(&|$)/,
    );
    await expectSelectedTab(page, "Completed");
  });

  test("restores the tab and the priority from a bookmarked URL", async ({
    page,
  }) => {
    const request = waitForListRequest(
      page,
      REQUEST_ORDERS,
      (params) =>
        params.get("status") === ALL_COMPLETED &&
        params.get("priority") === "urgent",
    );
    await page.goto(
      ordersUrl(`?tab=${encodeURIComponent(ALL_COMPLETED)}&priority=urgent`),
    );
    await request;

    await expectSelectedTab(page, "Completed");
    await expect(filterSelectButton(page, /urgent/i)).toBeVisible();
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const urls = recordRequestUrls(page, REQUEST_ORDERS);
    const request = waitForListRequest(
      page,
      REQUEST_ORDERS,
      (params) =>
        params.get("status") === "draft,pending" &&
        !params.has("priority") &&
        params.get("offset") === "0",
    );
    await page.goto(ordersUrl("?tab=bogus&priority=bogus&page=abc"));
    await request;
    await expectSelectedTab(page, "Requested");

    await expect(
      page.getByRole("heading", { name: "Purchase Orders" }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/priority=|page=abc/);
    expect(urls.join("\n")).not.toContain("bogus");
  });
});

test.describe("Inward entry list search params", () => {
  test("writes the selected tab to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(`${pharmacyPath}/inventory/external/deliveries/incoming`);
    await expectSelectedTab(page, "Created");

    const request = waitForListRequest(
      page,
      DELIVERY_ORDERS,
      (params) => params.get("status") === ALL_COMPLETED,
    );
    await tab(page, "Completed").click();
    await request;

    await expect(page).toHaveURL(
      /[?&]tab=completed%2Cabandoned%2Centered_in_error(&|$)/,
    );
    await expectSelectedTab(page, "Completed");
  });
});

test.describe("Delivery order form search params", () => {
  test("fills a new delivery from the request order in the URL", async ({
    page,
  }) => {
    let orderName: string;

    await test.step("Open a pending purchase order", async () => {
      await page.goto(`${pharmacyPath}/inventory/external/orders/outgoing`);
      const pendingOrder = page
        .getByRole("row")
        .filter({ hasText: "Pending" })
        .first();
      await expect(pendingOrder).toBeVisible();
      orderName = (await pendingOrder
        .getByRole("cell")
        .first()
        .textContent())!.trim();
      await pendingOrder.getByRole("button", { name: "See Details" }).click();
      await expect(
        page.getByRole("heading", { name: orderName, exact: true }),
      ).toBeVisible();
    });

    await test.step("Create a delivery order from it", async () => {
      await page.getByRole("link", { name: /Create Delivery Order/ }).click();

      await expect(page).toHaveURL(
        /\/inventory\/external\/deliveries\/incoming\/new\?supplyOrder=[0-9a-f-]+$/,
      );
      await expect(page.getByRole("textbox", { name: "Name" })).toHaveValue(
        orderName,
      );
    });
  });
});
