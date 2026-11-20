import { expect, test, type Page } from "@playwright/test";

import {
  applyOptionFilter,
  selectedMultiFilterBar,
} from "tests/helper/multiFilter";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The encounters overview reads its query string with a typed search schema
// (`encounterListSearch` in `src/lib/router/search/encounter.ts`).

/** The next encounter list request of the facility that matches `match`. */
const encounterListRequest = (
  page: Page,
  facilityId: string,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      request.method() === "GET" &&
      url.pathname === "/api/v1/encounter/" &&
      url.searchParams.get("facility") === facilityId &&
      match(url.searchParams)
    );
  });

test.describe("Encounter list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/encounters/patients/all${search ? `?${search}` : ""}`;
  };

  test("writes the priority filter to the URL and the list request", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await expect(page.getByRole("button", { name: /^filter$/i })).toBeVisible();

    const request = encounterListRequest(
      page,
      facilityId,
      (params) => params.get("priority") === "urgent",
    );
    await applyOptionFilter(page, /^priority$/i, /^urgent$/i);
    await request;

    await expect(page).toHaveURL(/[?&]priority=urgent(&|$)/);
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
    await expect(selectedMultiFilterBar(page, /priority/i)).toContainText(
      /urgent/i,
    );
  });

  test("restores the status filter from a bookmarked URL", async ({ page }) => {
    const request = encounterListRequest(
      page,
      facilityId,
      (params) => params.get("status") === "in_progress",
    );
    await page.goto(listUrl({ status: "in_progress" }));
    await request;

    await expect(selectedMultiFilterBar(page, /status/i)).toContainText(
      /in progress/i,
    );
    await expect(page).toHaveURL(/[?&]status=in_progress(&|$)/);
  });

  test("ignores an invalid page in a bookmarked URL", async ({ page }) => {
    const request = encounterListRequest(page, facilityId, () => true);
    await page.goto(listUrl({ page: "abc" }));

    await test.step("Lists the first page", async () => {
      const params = new URL((await request).url()).searchParams;
      expect(params.get("offset")).toBe("0");
      // The router drops the invalid page when the page loads.
      await expect(page).not.toHaveURL(/page=abc/);
    });

    await test.step("Keeps it out on the next filter change", async () => {
      const filtered = encounterListRequest(
        page,
        facilityId,
        (params) => params.get("priority") === "urgent",
      );
      await applyOptionFilter(page, /^priority$/i, /^urgent$/i);
      await filtered;

      await expect(page).toHaveURL(/[?&]priority=urgent(&|$)/);
      await expect(page).toHaveURL(/[?&]page=1(&|$)/);
      await expect(page).not.toHaveURL(/page=abc/);
    });
  });
});
