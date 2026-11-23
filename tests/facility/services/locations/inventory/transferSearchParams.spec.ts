import { expect, test, type Page } from "@playwright/test";
import {
  openServiceLocation,
  recordRequestUrls,
  waitForListRequest,
} from "tests/facility/services/helpers";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The To Dispatch and To Receive pages read their query strings with typed
// search schemas (`src/lib/router/search/inventory.ts`). The route reads
// `status` as a string: the requests tabs use one status, the deliveries
// tabs of To Dispatch a comma-separated list.

const REQUEST_ORDERS = "/order/request/";
const DELIVERY_ORDERS = "/order/delivery/";
const ALL_COMPLETED = "completed,abandoned,entered_in_error";

let pharmacyPath: string;
let labPath: string;

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
  labPath = await openServiceLocation(
    page,
    getFacilityId(),
    "Pathology Lab",
    "Bio-Chemistry",
  );
  await context.close();
});

const tab = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true });

async function expectSelectedTab(page: Page, name: string) {
  await expect(tab(page, name)).toHaveAttribute("aria-selected", "true");
}

test.describe("To Dispatch search params", () => {
  const dispatchUrl = (path = "", search = "") =>
    `${pharmacyPath}/inventory/internal/dispatch${path}${search}`;

  test("writes the status of a request to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(dispatchUrl());
    await expectSelectedTab(page, "Pending");

    const request = waitForListRequest(
      page,
      REQUEST_ORDERS,
      (params) => params.get("status") === "completed",
    );
    await tab(page, "Completed").click();
    await request;

    await expect(page).toHaveURL(/[?&]status=completed(&|$)/);
    await expectSelectedTab(page, "Completed");
  });

  test("keeps the statuses of a bookmarked deliveries tab", async ({
    page,
  }) => {
    const request = waitForListRequest(
      page,
      DELIVERY_ORDERS,
      (params) => params.get("status") === ALL_COMPLETED,
    );
    await page.goto(
      dispatchUrl(
        "/deliveries",
        `?status=${encodeURIComponent(ALL_COMPLETED)}`,
      ),
    );
    await request;

    await expectSelectedTab(page, "Outgoing Deliveries");
    await expectSelectedTab(page, "Completed");
    await expect(page).toHaveURL(
      /[?&]status=completed%2Cabandoned%2Centered_in_error(&|$)/,
    );
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const urls = recordRequestUrls(page, REQUEST_ORDERS);
    const request = waitForListRequest(
      page,
      REQUEST_ORDERS,
      (params) =>
        params.get("status") === "pending" &&
        !params.has("priority") &&
        !params.has("date_after") &&
        params.get("offset") === "0",
    );
    await page.goto(
      dispatchUrl("", "?status=bogus&priority=bogus&page=abc&date_after=bogus"),
    );
    await request;

    await expectSelectedTab(page, "Pending");
    await expect(page).toHaveURL(/[?&]status=pending(&|$)/);
    await expect(page).not.toHaveURL(/bogus|page=abc/);
    expect(urls.join("\n")).not.toContain("bogus");
  });
});

test.describe("To Receive search params", () => {
  const receiveUrl = (path = "", search = "") =>
    `${labPath}/inventory/internal/receive${path}${search}`;

  test("writes the status of a delivery to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(receiveUrl("/deliveries"));
    await expectSelectedTab(page, "Incoming Deliveries");
    await expectSelectedTab(page, "In Transit");

    const request = waitForListRequest(
      page,
      DELIVERY_ORDERS,
      (params) => params.get("status") === "completed",
    );
    await tab(page, "Completed").click();
    await request;

    await expect(page).toHaveURL(/[?&]status=completed(&|$)/);
    await expectSelectedTab(page, "Completed");
  });

  test("ignores an invalid delivery status", async ({ page }) => {
    const urls = recordRequestUrls(page, DELIVERY_ORDERS);
    const request = waitForListRequest(
      page,
      DELIVERY_ORDERS,
      (params) => params.get("status") === "pending",
    );
    await page.goto(receiveUrl("/deliveries", "?status=bogus"));
    await request;

    await expectSelectedTab(page, "In Transit");
    await expect(page).toHaveURL(/[?&]status=pending(&|$)/);
    expect(urls.join("\n")).not.toContain("bogus");
  });
});
