import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  queryParam,
  recordApiQueries,
  waitForApiList,
  withSearch,
} from "tests/helper/searchParams";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The device pages read their query strings with typed search schemas
// (`src/lib/router/search/settings.ts`): the device list (`deviceListSearch`),
// the add device page (`deviceFormSearch`) and the service history of a
// device (`deviceShowSearch`).

const RESULTS_PER_PAGE_LIMIT = 14;

test.describe("Device search params", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  const devicesPath = () => `/facility/${facilityId}/settings/devices`;

  test("writes the device search to the URL and the API request", async ({
    page,
  }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    await page.goto(devicesPath());
    await expect(page.getByRole("heading", { name: "Devices" })).toBeVisible();

    const request = waitForApiList(
      page,
      "/device/",
      (params) => params.get("search_text") === searchText,
    );
    await page
      .getByRole("textbox", { name: "Search devices..." })
      .fill(searchText);
    await request;

    await expect(page).toHaveURL(queryParam("search_text", searchText));
    await expect(
      page.getByText("No devices match your search criteria"),
    ).toBeVisible();
  });

  test("restores the device search from a bookmarked URL", async ({ page }) => {
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    const request = waitForApiList(
      page,
      "/device/",
      (params) => params.get("search_text") === searchText,
    );
    await page.goto(withSearch(devicesPath(), { search_text: searchText }));
    await request;

    await expect(
      page.getByRole("textbox", { name: "Search devices..." }),
    ).toHaveValue(searchText);
    await expect(page).toHaveURL(queryParam("search_text", searchText));
  });

  test("reads an invalid page number as the first page", async ({ page }) => {
    const api = recordApiQueries(page);
    const request = waitForApiList(
      page,
      "/device/",
      (params) => params.get("offset") === "0",
    );
    await page.goto(withSearch(devicesPath(), { page: "abc" }));
    await request;

    await expect(
      page.getByRole("button", { name: "Go to page 1", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    api.expectNotSent("abc");
  });

  test("shows the device type of the add device link", async ({ page }) => {
    await page.goto(withSearch(`${devicesPath()}/create`, { type: "camera" }));
    await expect(page.getByText("Add camera Device")).toBeVisible();

    await page.goto(`${devicesPath()}/create`);
    await expect(page.getByText("Add Device", { exact: true })).toBeVisible();
  });

  test("opens the bookmarked page of the service history", async ({ page }) => {
    const list = waitForApiList(page, "/device/");
    await page.goto(devicesPath());
    const { results } = (await (await list).json()) as {
      results: { id: string }[];
    };
    const deviceId = results[0].id;

    const history = waitForApiList(
      page,
      `/device/${deviceId}/service_history/`,
      (params) => params.get("offset") === String(RESULTS_PER_PAGE_LIMIT),
    );
    await page.goto(withSearch(`${devicesPath()}/${deviceId}`, { page: "2" }));
    await history;

    await expect(page.getByText("Service History").first()).toBeVisible();
    await expect(page).toHaveURL(queryParam("page", 2));
  });
});
