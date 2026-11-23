import { expect, test, type Page } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// The files tab of a patient reads its query string with a typed search
// schema (`fileListSearch` in `src/lib/router/search/patient.ts`). The
// patient route lists only the keys that all patient tabs share.

test.describe("Patient files search params", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
  });

  const filesUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/patient/${patientId}/files${search ? `?${search}` : ""}`;
  };

  /** The next file list request of the patient. */
  const fileListRequest = (
    page: Page,
    match: (params: URLSearchParams) => boolean,
  ) =>
    page.waitForRequest((request) => {
      const url = new URL(request.url());
      return (
        request.method() === "GET" &&
        url.pathname === "/api/v1/files/" &&
        url.searchParams.get("associating_id") === patientId &&
        match(url.searchParams)
      );
    });

  const filterBadge = (page: Page, name: string) =>
    page
      .getByRole("tabpanel", { name: "Files", exact: true })
      .locator('[data-slot="badge"]')
      .filter({ hasText: name });

  test("writes the archived filter to the URL and the list request", async ({
    page,
  }) => {
    await page.goto(filesUrl());
    await expect(
      page.getByRole("textbox", { name: /search files/i }),
    ).toBeVisible();

    const request = fileListRequest(
      page,
      (params) => params.get("is_archived") === "true",
    );
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await page.getByRole("menuitem", { name: "Archived Files" }).click();
    await request;

    await expect(page).toHaveURL(/[?&]is_archived=true(&|$)/);
    await expect(filterBadge(page, "Archived Files")).toBeVisible();
  });

  test("restores the archived filter from a bookmarked URL", async ({
    page,
  }) => {
    const request = fileListRequest(
      page,
      (params) => params.get("is_archived") === "false",
    );
    await page.goto(filesUrl({ is_archived: "false" }));
    await request;

    await expect(filterBadge(page, "Active Files")).toBeVisible();
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const request = fileListRequest(page, () => true);
    await page.goto(filesUrl({ is_archived: "bogus", page: "abc" }));
    const params = new URL((await request).url()).searchParams;

    expect(params.get("is_archived")).toBeNull();
    expect(params.get("offset")).toBe("0");
    await expect(
      page.getByRole("textbox", { name: /search files/i }),
    ).toBeVisible();
    await expect(filterBadge(page, "Active Files")).toBeHidden();
    await expect(filterBadge(page, "Archived Files")).toBeHidden();
  });

  test("opens the reports sub tab named in the URL", async ({ page }) => {
    await page.goto(filesUrl({ file: "reports" }));

    await expect(
      page.getByRole("tab", { name: "Reports", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  });
});
