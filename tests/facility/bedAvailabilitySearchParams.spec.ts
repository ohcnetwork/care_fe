import { expect, test, type Page } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The bed availability dashboard reads its filters with a typed search
// schema (`src/lib/router/search/services.ts`) and caches them per page.

async function openFilters(page: Page) {
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Filter Options" });
  await expect(sheet).toBeVisible();
  return sheet.getByRole("combobox", { name: "Availability Status" });
}

test.describe("Bed availability search params", () => {
  let dashboardUrl: string;

  test.beforeEach(() => {
    dashboardUrl = `/facility/${getFacilityId()}/bed-availability`;
  });

  const heading = (page: Page) =>
    page.getByRole("heading", { name: "Bed Availability Dashboard" });

  test("writes the status filter to the URL", async ({ page }) => {
    await page.goto(dashboardUrl);
    await expect(heading(page)).toBeVisible();

    const status = await openFilters(page);
    await status.click();
    await page.getByRole("option", { name: "Occupied", exact: true }).click();

    await expect(page).toHaveURL(/[?&]status=occupied(&|$)/);
    await expect(status).toHaveText("Occupied");
  });

  test("restores the filters from a bookmarked URL", async ({ page }) => {
    await page.goto(`${dashboardUrl}?status=reserved&search=ward`);
    await expect(heading(page)).toBeVisible();

    await expect(
      page.getByRole("textbox", { name: "Search wards/units..." }),
    ).toHaveValue("ward");
    await expect(await openFilters(page)).toHaveText("Reserved");
    await expect(page).toHaveURL(/[?&]status=reserved(&|$)/);
  });

  test("ignores an invalid status", async ({ page }) => {
    await page.goto(`${dashboardUrl}?status=bogus`);
    await expect(heading(page)).toBeVisible();

    await expect(await openFilters(page)).toHaveText("All Statuses");
    await expect(page).not.toHaveURL(/status=/);
  });

  test("restores the cached filters without the refresh time", async ({
    page,
  }) => {
    await page.goto(`${dashboardUrl}?status=occupied`);
    await expect(heading(page)).toBeVisible();
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(page).toHaveURL(/[?&]refresh=\d+(&|$)/);

    await page.goto(`/facility/${getFacilityId()}/overview`);
    await expect(page).toHaveURL(/\/overview$/);
    await page.goto(dashboardUrl);

    await expect(page).toHaveURL(/[?&]status=occupied(&|$)/);
    await expect(page).not.toHaveURL(/refresh=/);
  });
});
