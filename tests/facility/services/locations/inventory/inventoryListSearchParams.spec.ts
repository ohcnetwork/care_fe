import { expect, test, type Page } from "@playwright/test";
import {
  openServiceLocation,
  recordRequestUrls,
  waitForListRequest,
} from "tests/facility/services/helpers";
import { selectedMultiFilterBar } from "tests/helper/multiFilter";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The stock of a location reads its query string with a typed search schema
// (`src/lib/router/search/inventory.ts`).

const PRODUCTS = "/product/";

test.describe("Inventory list search params", () => {
  let summaryUrl: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    const pharmacyPath = await openServiceLocation(
      page,
      getFacilityId(),
      "Main Pharmacy",
      "Pharmacy",
    );
    summaryUrl = `${pharmacyPath}/inventory/summary`;
    await context.close();
  });

  const heading = (page: Page) =>
    page.getByRole("heading", { name: "Inventory", exact: true });
  const sortSelect = (page: Page, text: string) =>
    page.getByRole("combobox").filter({ hasText: text });

  test("writes the status filter and the sort order to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(summaryUrl);
    await expect(heading(page)).toBeVisible();

    await test.step("Filter by status", async () => {
      const request = waitForListRequest(
        page,
        PRODUCTS,
        (params) => params.get("status") === "active",
      );
      await page.getByRole("button", { name: "Filters", exact: true }).click();
      await page.getByRole("option", { name: "Status", exact: true }).click();
      await page.getByRole("option", { name: "Active", exact: true }).click();
      await page.keyboard.press("Escape");
      await request;

      await expect(page).toHaveURL(/[?&]status=active(&|$)/);
      await expect(page).toHaveURL(/[?&]page=1(&|$)/);
      await expect(selectedMultiFilterBar(page, /status/i)).toContainText(
        /active/i,
      );
    });

    await test.step("Sort by net content", async () => {
      const request = waitForListRequest(
        page,
        PRODUCTS,
        (params) =>
          params.get("ordering") === "-net_content" &&
          params.get("status") === "active",
      );
      await page.keyboard.press("Escape");
      await sortSelect(page, "Sort By").click();
      await page
        .getByRole("option", { name: "Highest Net Content First" })
        .click();
      await request;

      await expect(page).toHaveURL(/[?&]ordering=-net_content(&|$)/);
      await expect(page).toHaveURL(/[?&]status=active(&|$)/);
    });
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const request = waitForListRequest(
      page,
      PRODUCTS,
      (params) =>
        params.get("status") === "active" &&
        params.get("ordering") === "-net_content",
    );
    await page.goto(`${summaryUrl}?status=active&ordering=-net_content`);
    await request;

    await expect(selectedMultiFilterBar(page, /status/i)).toContainText(
      /active/i,
    );
    await expect(sortSelect(page, "Highest Net Content First")).toBeVisible();
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const urls = recordRequestUrls(page, PRODUCTS);
    const request = waitForListRequest(
      page,
      PRODUCTS,
      (params) =>
        !params.has("status") &&
        !params.has("product_expiration_date_after") &&
        params.get("offset") === "0",
    );
    await page.goto(
      `${summaryUrl}?status=bogus&page=abc&product_expiration_date_after=bogus`,
    );
    await request;

    await expect(heading(page)).toBeVisible();
    await expect(selectedMultiFilterBar(page, /status/i)).toBeHidden();
    await expect(page).not.toHaveURL(/bogus|page=abc/);
    expect(urls.join("\n")).not.toContain("bogus");
  });
});
