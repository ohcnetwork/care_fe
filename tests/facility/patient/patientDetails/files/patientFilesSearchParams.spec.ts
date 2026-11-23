import { expect, test, type Page } from "@playwright/test";

import { filterSelectButton } from "tests/helper/searchParams";
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

  const statusFilter = (page: Page) => filterSelectButton(page, "Status");

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
    await statusFilter(page).click();
    await page
      .getByRole("menuitemradio", { name: "Archived", exact: true })
      .click();
    await request;

    await expect(page).toHaveURL(/[?&]is_archived=true(&|$)/);
    await expect(statusFilter(page)).toContainText("Archived");
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

    await expect(statusFilter(page)).toContainText("Active");
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
    await expect(statusFilter(page)).toHaveText("Status");
  });

  test("opens the reports sub tab named in the URL", async ({ page }) => {
    await page.goto(filesUrl({ file: "reports" }));

    await expect(
      page.getByRole("tab", { name: "Reports", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
  });
});
