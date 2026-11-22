import { expect, test, type Page } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// The resource pages read their query string with typed search schemas
// (`src/lib/router/search/resource.ts`).

/** The next resource list request whose query matches `match`. */
const resourceListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === "/api/v1/resource/" &&
      match(url.searchParams)
    );
  });

const tab = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true });

test.describe("Resource list search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const listUrl = (params: Record<string, string> = {}) => {
    const search = new URLSearchParams(params).toString();
    return `/facility/${facilityId}/resource${search ? `?${search}` : ""}`;
  };

  test("writes the direction and status to the URL and the request", async ({
    page,
  }) => {
    await page.goto(listUrl());
    await expect(tab(page, "Outgoing")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await test.step("Incoming lists the requests assigned to the facility", async () => {
      const request = resourceListRequest(
        page,
        (params) => params.get("assigned_facility") === facilityId,
      );
      await tab(page, "Incoming").click();
      await request;

      await expect(page).toHaveURL(/[?&]incoming=true(&|$)/);
      await expect(tab(page, "Incoming")).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    await test.step("A status tab filters the list", async () => {
      const request = resourceListRequest(
        page,
        (params) =>
          params.get("assigned_facility") === facilityId &&
          params.get("status") === "approved",
      );
      await tab(page, "Approved").click();
      await request;

      await expect(page).toHaveURL(/[?&]status=approved(&|$)/);
      await expect(page).toHaveURL(/[?&]incoming=true(&|$)/);
    });
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const request = resourceListRequest(
      page,
      (params) =>
        params.get("assigned_facility") === facilityId &&
        params.get("status") === "approved",
    );
    await page.goto(listUrl({ status: "approved", incoming: "true" }));
    await request;

    await expect(tab(page, "Approved")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(tab(page, "Incoming")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const request = resourceListRequest(
      page,
      (params) => params.get("origin_facility") === facilityId,
    );
    await page.goto(
      listUrl({ status: "bogus", incoming: "maybe", page: "abc" }),
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("status")).toBe("pending");
    expect(params.get("assigned_facility")).toBeNull();
    expect(params.get("offset")).toBe("0");
    await expect(tab(page, "Pending")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "Outgoing")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("restores the filters when the list opens again", async ({ page }) => {
    // The resource list keeps its filters (`useFilters({ cache: true })`).
    await page.goto(listUrl());
    await tab(page, "Approved").click();
    await expect(page).toHaveURL(/[?&]status=approved(&|$)/);

    await page.goto(`/facility/${facilityId}/overview`);
    await expect(page).toHaveURL(/\/overview$/);

    await page.goto(listUrl());

    await expect(page).toHaveURL(/[?&]status=approved(&|$)/);
    await expect(tab(page, "Approved")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

test.describe("Resource form search params", () => {
  test("links the request to the patient in related_patient", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    await page.goto(
      `/facility/${facilityId}/resource/new?related_patient=${patientId}`,
    );

    await expect(page.getByText("Linked Patient:")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Linked Patient:/ }),
    ).toHaveAttribute(
      "href",
      `/facility/${facilityId}/patient/${patientId}/resource_requests`,
    );
  });
});
