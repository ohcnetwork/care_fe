import { expect, test, type Page } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The workspace lists read their query string with a typed search schema
// (`workspaceListSearch` in `src/lib/router/search/encounter.ts`).

/** The next workspace list request that matches `match`. */
const workspaceListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      request.method() === "GET" &&
      url.pathname === "/api/v1/workspace/" &&
      match(url.searchParams)
    );
  });

const statusTab = (page: Page, name: string) =>
  page
    .getByRole("tablist", { name: "Status" })
    .getByRole("tab", { name, exact: true });

test.describe("Workspace list search params", () => {
  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/admin/workspaces${search ? `?${search}` : ""}`;
  };

  test("writes the status tab to the URL and the list request", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await expect(statusTab(page, "Active")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const request = workspaceListRequest(
      page,
      (params) => params.get("status") === "draft",
    );
    await statusTab(page, "Draft").click();
    await request;

    await expect(page).toHaveURL(/[?&]status=draft(&|$)/);
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
    await expect(statusTab(page, "Draft")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("restores the status from a bookmarked URL", async ({ page }) => {
    const request = workspaceListRequest(
      page,
      (params) => params.get("status") === "archived",
    );
    await page.goto(listUrl({ status: "archived" }));
    await request;

    await expect(statusTab(page, "Archived")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const request = workspaceListRequest(page, () => true);
    await page.goto(listUrl({ status: "bogus", page: "abc" }));
    const params = new URL((await request).url()).searchParams;

    expect(params.get("status")).toBe("active");
    expect(params.get("offset")).toBe("0");
    await expect(statusTab(page, "Active")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("restores the status of the facility list from a bookmarked URL", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const request = workspaceListRequest(
      page,
      (params) =>
        params.get("facility") === facilityId &&
        params.get("status") === "draft",
    );
    await page.goto(`/facility/${facilityId}/settings/workspaces?status=draft`);
    await request;

    await expect(statusTab(page, "Draft")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
