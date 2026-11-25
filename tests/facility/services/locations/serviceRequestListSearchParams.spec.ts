import { expect, test, type Page } from "@playwright/test";
import {
  openServiceLocation,
  recordRequestUrls,
  waitForListRequest,
} from "tests/facility/services/helpers";
import { selectedMultiFilterBar } from "tests/helper/multiFilter";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The service requests of a location read their query string with a typed
// search schema (`src/lib/router/search/services.ts`).

test.describe("Service request list search params", () => {
  let listUrl: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    const locationPath = await openServiceLocation(
      page,
      getFacilityId(),
      "Pathology Lab",
      "Bio-Chemistry",
    );
    listUrl = `${locationPath}/service_requests`;
    await context.close();
  });

  const statusTab = (page: Page, name: string) =>
    page.getByRole("tab", { name, exact: true });

  test("writes the status tab to the URL and the API request", async ({
    page,
  }) => {
    await page.goto(listUrl);
    await expect(statusTab(page, "Active")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const request = waitForListRequest(
      page,
      "/service_request/",
      (params) => params.get("status") === "on_hold",
    );
    await statusTab(page, "On Hold").click();
    await request;

    await expect(page).toHaveURL(/[?&]status=on_hold(&|$)/);
    await expect(statusTab(page, "On Hold")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const request = waitForListRequest(
      page,
      "/service_request/",
      (params) =>
        params.get("status") === "completed" &&
        params.get("priority") === "urgent",
    );
    await page.goto(`${listUrl}?status=completed&priority=urgent`);
    await request;

    await expect(statusTab(page, "Completed")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(selectedMultiFilterBar(page, /priority/i)).toContainText(
      /urgent/i,
    );
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const urls = recordRequestUrls(page, "/service_request/");
    const request = waitForListRequest(
      page,
      "/service_request/",
      (params) =>
        params.get("status") === "active" &&
        !params.has("priority") &&
        params.get("offset") === "0",
    );
    await page.goto(`${listUrl}?status=bogus&priority=bogus&page=abc`);
    await request;

    await expect(statusTab(page, "Active")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page).toHaveURL(/[?&]status=active(&|$)/);
    await expect(page).not.toHaveURL(/priority=|page=abc/);
    expect(urls.join("\n")).not.toContain("bogus");
  });
});
