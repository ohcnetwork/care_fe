import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import type { FacilityPublicRead } from "@/types/facility/facility";

// The public facility pages read their query string with typed search
// schemas (`facilitiesPageSearch` and `facilityDetailsPageSearch` in
// `src/lib/router/search/facility.ts`). They are public: no sign-in.

/** The next public facility list request whose query matches `match`. */
const facilityListRequest = (
  page: Page,
  match: (params: URLSearchParams) => boolean,
) =>
  page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      response.request().method() === "GET" &&
      url.pathname === "/api/v1/getallfacilities/" &&
      match(url.searchParams)
    );
  });

/** Opens the facility list and returns the id of its first location. */
async function firstLocationId(page: Page) {
  const response = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === "/api/v1/govt/organization/" &&
      url.searchParams.get("level_cache") === "1"
    );
  });
  await page.goto("/facilities");
  const { results } = (await (await response).json()) as {
    results: { id: string }[];
  };
  expect(results.length).toBeGreaterThan(0);
  return results[0].id;
}

const nameSearch = (page: Page) =>
  page.getByPlaceholder("Search by facility name");

test.describe("Public facility list search params", () => {
  test("writes the name search to the URL and the request", async ({
    page,
  }) => {
    const organization = await firstLocationId(page);
    await page.goto(`/facilities?organization=${organization}`);

    const request = facilityListRequest(
      page,
      (params) =>
        params.get("organization") === organization &&
        params.get("name") === "zz",
    );
    await nameSearch(page).fill("zz");
    await request;

    await expect(page).toHaveURL(/[?&]name=zz(&|$)/);
    await expect(page).toHaveURL(
      new RegExp(`[?&]organization=${organization}(&|$)`),
    );
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    const organization = await firstLocationId(page);

    const request = facilityListRequest(
      page,
      (params) =>
        params.get("organization") === organization &&
        params.get("name") === "zz",
    );
    await page.goto(`/facilities?organization=${organization}&name=zz`);
    await request;

    await expect(nameSearch(page)).toHaveValue("zz");
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    const organization = await firstLocationId(page);

    const request = facilityListRequest(
      page,
      (params) => params.get("organization") === organization,
    );
    await page.goto(
      `/facilities?organization=${organization}&facility_type=bogus&page=abc`,
    );
    const params = new URL((await request).url()).searchParams;

    expect(params.get("facility_type")).toBeNull();
    expect(params.get("page")).toBe("1");
    expect(params.get("offset")).toBe("0");
  });

  test("restores the filters when the list opens again", async ({ page }) => {
    // The facility list keeps its filters (`useFilters({ cache: true })`).
    const organization = await firstLocationId(page);
    await page.goto(`/facilities?organization=${organization}`);
    await nameSearch(page).fill("zz");
    await expect(page).toHaveURL(/[?&]name=zz(&|$)/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/facilities");

    await expect(page).toHaveURL(
      new RegExp(`[?&]organization=${organization}(&|$)`),
    );
    await expect(nameSearch(page)).toHaveValue("zz");
  });
});

test.describe("Public facility page search params", () => {
  test("opens with an invalid page in the URL", async ({ page }) => {
    // The public endpoint lists only public facilities, and the fixture
    // facility need not be one. Serve a public facility for this page.
    const facility: FacilityPublicRead = {
      id: faker.string.uuid(),
      name: `Public facility ${faker.string.alphanumeric(8)}`,
      description: "",
      address: "12 Example Road",
      phone_number: "+919876543210",
      facility_type: "Private Hospital",
      is_public: true,
      features: [],
      geo_organization: {
        id: faker.string.uuid(),
        name: "Kerala",
        org_type: "govt",
        metadata: { govt_org_type: "state" },
        level_cache: 1,
        has_children: false,
        active: true,
        created_at: "",
        updated_at: "",
        permissions: [],
      },
    };
    await page.route(`**/api/v1/getallfacilities/${facility.id}/`, (route) =>
      route.fulfill({ json: facility }),
    );

    await page.goto(`/facility/${facility.id}?page=abc`);

    await expect(
      page.getByRole("heading", { name: facility.name }),
    ).toBeVisible();
    // The router drops the invalid page when the page loads.
    await expect(page).not.toHaveURL(/page=abc/);
  });
});
