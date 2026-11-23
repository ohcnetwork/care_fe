import { expect, test, type Page } from "@playwright/test";
import {
  openServiceLocation,
  recordRequestUrls,
  waitForListRequest,
} from "tests/facility/services/helpers";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The prescription queue, dispense orders and medication returns of a
// pharmacy read their query strings with typed search schemas
// (`src/lib/router/search/pharmacy.ts`).

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

test.describe("Prescription queue search params", () => {
  const SUMMARY = "/medication_prescription/summary/";
  const queueUrl = (search = "") =>
    `${pharmacyPath}/medication_requests${search}`;

  test("writes the status tab to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(queueUrl());
    await expectSelectedTab(page, "Billing Pending");

    const request = waitForListRequest(
      page,
      SUMMARY,
      (params) => params.get("status") === "completed",
    );
    await tab(page, "Completed").click();
    await request;

    await expect(page).toHaveURL(/[?&]status=completed(&|$)/);
    await expectSelectedTab(page, "Completed");
  });

  test("restores the status from a bookmarked URL", async ({ page }) => {
    const request = waitForListRequest(
      page,
      SUMMARY,
      (params) => params.get("status") === "cancelled",
    );
    await page.goto(queueUrl("?status=cancelled"));
    await request;

    await expectSelectedTab(page, "Cancelled");
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const urls = recordRequestUrls(page, SUMMARY);
    const request = waitForListRequest(
      page,
      SUMMARY,
      (params) =>
        params.get("status") === "active" &&
        params.get("offset") === "0" &&
        !params.has("created_date_after"),
    );
    await page.goto(
      queueUrl("?status=bogus&page=abc&created_date_after=bogus"),
    );
    await request;

    await expectSelectedTab(page, "Billing Pending");
    await expect(page).not.toHaveURL(/bogus|page=abc/);
    expect(urls.join("\n")).not.toContain("bogus");
  });

  test("restores cached filters, but not the status", async ({ page }) => {
    await page.goto(queueUrl("?encounter_class=amb&status=completed"));
    await expectSelectedTab(page, "Completed");

    await page.goto(`/facility/${getFacilityId()}/overview`);
    await expect(page).toHaveURL(/\/overview$/);

    const request = waitForListRequest(
      page,
      SUMMARY,
      (params) =>
        params.get("encounter_class") === "amb" &&
        params.get("status") === "active",
    );
    await page.goto(queueUrl());
    await request;

    await expect(page).toHaveURL(/[?&]encounter_class=amb(&|$)/);
    await expect(page).not.toHaveURL(/status=/);
    await expectSelectedTab(page, "Billing Pending");
  });
});

test.describe("Dispense order list search params", () => {
  const DISPENSE_ORDERS = "/order/dispense/";
  const listUrl = (search = "") =>
    `${pharmacyPath}/medication_dispense${search}`;

  test("writes the history tab to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await expectSelectedTab(page, "Pending");

    const request = waitForListRequest(
      page,
      DISPENSE_ORDERS,
      (params) =>
        params.get("status") === "completed,entered_in_error,abandoned",
    );
    await tab(page, "History").click();
    await request;

    await expect(page).toHaveURL(/[?&]exclude_status=history(&|$)/);
    await expectSelectedTab(page, "History");
  });

  test("restores the history tab from a bookmarked URL", async ({ page }) => {
    const request = waitForListRequest(
      page,
      DISPENSE_ORDERS,
      (params) =>
        params.get("status") === "completed,entered_in_error,abandoned",
    );
    await page.goto(listUrl("?exclude_status=history"));
    await request;

    await expectSelectedTab(page, "History");
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const urls = recordRequestUrls(page, DISPENSE_ORDERS);
    const request = waitForListRequest(
      page,
      DISPENSE_ORDERS,
      (params) =>
        params.get("status") === "draft,in_progress" &&
        params.get("offset") === "0" &&
        !params.has("created_date_after"),
    );
    await page.goto(
      listUrl("?exclude_status=bogus&page=abc&created_date_after=bogus"),
    );
    await request;

    await expectSelectedTab(page, "Pending");
    await expect(page).not.toHaveURL(/bogus|page=abc/);
    expect(urls.join("\n")).not.toContain("bogus");
  });
});

test.describe("Medication return list search params", () => {
  const DELIVERY_ORDERS = "/order/delivery/";
  const listUrl = (search = "") => `${pharmacyPath}/medication_return${search}`;

  test("writes the status tab to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await expectSelectedTab(page, "All");

    const completed = waitForListRequest(
      page,
      DELIVERY_ORDERS,
      (params) => params.get("status") === "completed",
    );
    await tab(page, "Completed").click();
    await completed;
    await expect(page).toHaveURL(/[?&]status=completed(&|$)/);

    // "All" stays in the URL, as before.
    const all = waitForListRequest(
      page,
      DELIVERY_ORDERS,
      (params) => !params.has("status"),
    );
    await tab(page, "All").click();
    await all;
    await expect(page).toHaveURL(/[?&]status=all(&|$)/);
    await expectSelectedTab(page, "All");
  });

  test("restores the status from a bookmarked URL", async ({ page }) => {
    const request = waitForListRequest(
      page,
      DELIVERY_ORDERS,
      (params) => params.get("status") === "abandoned",
    );
    await page.goto(listUrl("?status=abandoned"));
    await request;

    await expectSelectedTab(page, "Abandoned");
  });

  test("ignores an invalid status", async ({ page }) => {
    const urls = recordRequestUrls(page, DELIVERY_ORDERS);
    const request = waitForListRequest(
      page,
      DELIVERY_ORDERS,
      (params) => !params.has("status") && params.get("offset") === "0",
    );
    await page.goto(listUrl("?status=bogus&page=abc"));
    await request;

    await expectSelectedTab(page, "All");
    await expect(page).not.toHaveURL(/bogus|page=abc/);
    expect(urls.join("\n")).not.toContain("bogus");
  });
});
