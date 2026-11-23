import { expect, test, type Page } from "@playwright/test";

import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// The tabs of an encounter share its query string (`encounterShowSearch` in
// `src/lib/router/search/encounter.ts`); each tab parses its own schema.

test.describe("Encounter tabs search params", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
  });

  const tabUrl = (tab: string, params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/${tab}${search ? `?${search}` : ""}`;
  };

  /** The next service request list request of the encounter. */
  const serviceRequestListRequest = (
    page: Page,
    match: (params: URLSearchParams) => boolean,
  ) =>
    page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        request.method() === "GET" &&
        url.pathname === `/api/v1/facility/${facilityId}/service_request/` &&
        url.searchParams.get("encounter") === encounterId &&
        match(url.searchParams)
      );
    });

  const statusTab = (page: Page, name: string) =>
    page.getByRole("tab", { name, exact: true });

  test("writes the service request status to the URL", async ({ page }) => {
    await page.goto(tabUrl("service_requests"));
    await expect(statusTab(page, "All")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const request = serviceRequestListRequest(
      page,
      (params) => params.get("status") === "active",
    );
    await statusTab(page, "Active").click();
    await request;

    await expect(page).toHaveURL(/[?&]status=active(&|$)/);
    await expect(statusTab(page, "Active")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("restores the service request filters from a bookmarked URL", async ({
    page,
  }) => {
    const request = serviceRequestListRequest(
      page,
      (params) =>
        params.get("status") === "completed" &&
        params.get("priority") === "urgent",
    );
    await page.goto(
      tabUrl("service_requests", { status: "completed", priority: "urgent" }),
    );
    await request;

    await expect(statusTab(page, "Completed")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("ignores invalid service request filters in a bookmarked URL", async ({
    page,
  }) => {
    const request = serviceRequestListRequest(page, () => true);
    await page.goto(
      tabUrl("service_requests", {
        status: "bogus",
        priority: "bogus",
        page: "abc",
      }),
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("status")).toBeNull();
    expect(params.get("priority")).toBeNull();
    expect(params.get("offset")).toBe("0");
    await expect(statusTab(page, "All")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("opens the files sub tab named in the URL", async ({ page }) => {
    await page.goto(tabUrl("files", { file: "reports" }));
    // The encounter navigation also has a "Files" tab.
    const subTabs = page
      .getByRole("tablist")
      .filter({ has: page.getByRole("tab", { name: "Reports", exact: true }) });
    const subTab = (name: string) =>
      subTabs.getByRole("tab", { name, exact: true });

    await expect(subTab("Reports")).toHaveAttribute("aria-selected", "true");

    await subTab("Files").click();

    await expect(page).toHaveURL(/[?&]file=all(&|$)/);
    await expect(subTab("Files")).toHaveAttribute("aria-selected", "true");
  });
});
