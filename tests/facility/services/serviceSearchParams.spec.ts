import { expect, test } from "@playwright/test";
import { waitForListRequest } from "tests/facility/services/helpers";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The services list reads its query string with a typed search schema
// (`src/lib/router/search/services.ts`).

const SERVICE_NAME = "Main Pharmacy";

test.describe("Facility services search params", () => {
  let servicesUrl: string;

  test.beforeEach(() => {
    servicesUrl = `/facility/${getFacilityId()}/services`;
  });

  test("writes the search to the URL and the API request", async ({ page }) => {
    await page.goto(servicesUrl);
    const searchBox = page.getByRole("textbox", {
      name: "Search healthcare services...",
      exact: true,
    });
    await expect(searchBox).toBeVisible();

    const request = waitForListRequest(
      page,
      "/healthcare_service/",
      (params) => params.get("name") === SERVICE_NAME,
    );
    await searchBox.fill(SERVICE_NAME);
    await request;

    await expect(page).toHaveURL(/[?&]search=Main\+Pharmacy(&|$)/);
    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
    await expect(page.getByRole("link", { name: SERVICE_NAME })).toBeVisible();
  });

  test("restores the search from a bookmarked URL", async ({ page }) => {
    const request = waitForListRequest(
      page,
      "/healthcare_service/",
      (params) => params.get("name") === SERVICE_NAME,
    );
    await page.goto(`${servicesUrl}?search=Main+Pharmacy`);
    await request;

    await expect(
      page.getByRole("textbox", {
        name: "Search healthcare services...",
        exact: true,
      }),
    ).toHaveValue(SERVICE_NAME);
    await expect(page.getByRole("link", { name: SERVICE_NAME })).toBeVisible();
  });

  test("ignores an invalid page number", async ({ page }) => {
    const request = waitForListRequest(
      page,
      "/healthcare_service/",
      (params) => params.get("offset") === "0",
    );
    await page.goto(`${servicesUrl}?page=abc`);
    await request;

    await expect(page.getByRole("heading", { name: "Services" })).toBeVisible();
    await expect(page).not.toHaveURL(/page=abc/);
  });
});
