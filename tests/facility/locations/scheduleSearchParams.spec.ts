import { expect, test, type Locator, type Page } from "@playwright/test";

import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The schedule of a location reads its query string with a typed search
// schema (`scheduleHomeSearch` in `src/lib/router/search/scheduling.ts`): the
// view (`tab`), the open sheet (`sheet`) and the dates of a new exception.

const addExceptionSheet = (page: Page) =>
  page.getByRole("dialog").filter({ hasText: "Add Schedule Exceptions" });

/** The range picker that edits `valid_from` and `valid_to` together. */
const validPeriod = (sheet: Locator) =>
  sheet.getByRole("button", { name: /^Valid Period/ });

test.describe("Location schedule search params", () => {
  let schedulePath: string;

  test.beforeEach(async ({ request }) => {
    const facilityId = getFacilityId();
    const locations = await request.get(
      `${getApiUrl()}/api/v1/facility/${facilityId}/location/?limit=1&mode=kind`,
      { headers: getApiHeaders() },
    );
    expect(locations.ok()).toBe(true);
    const [location] = (
      (await locations.json()) as {
        results: { id: string }[];
      }
    ).results;
    expect(location, "The facility needs a location").toBeDefined();
    schedulePath = `/facility/${facilityId}/locations/${location.id}/schedule`;
  });

  test("writes the view to the URL", async ({ page }) => {
    await page.goto(schedulePath);
    await expect(
      page.getByRole("button", { name: "Create Template", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Exceptions", exact: true }).click();

    await expect(page).toHaveURL(`${schedulePath}?tab=exceptions`);
    await expect(
      page.getByRole("button", { name: "Add Exception", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Schedule", exact: true }).click();

    await expect(page).toHaveURL(`${schedulePath}?tab=schedule`);
    await expect(
      page.getByRole("button", { name: "Create Template", exact: true }),
    ).toBeVisible();
  });

  test("opens the add exception sheet with its dates from a bookmarked URL", async ({
    page,
  }) => {
    await page.goto(
      `${schedulePath}?${new URLSearchParams({
        tab: "exceptions",
        sheet: "add_exception",
        valid_from: "2099-03-15",
        valid_to: "2099-03-16",
      })}`,
    );

    const sheet = addExceptionSheet(page);
    await expect(sheet).toBeVisible();
    // The validity range picker shows both dates from the URL.
    await expect(validPeriod(sheet)).toHaveText("Mar 15 – Mar 16, 2099");

    await test.step("Closing the sheet drops it and its dates from the URL", async () => {
      await page.keyboard.press("Escape");

      await expect(sheet).toBeHidden();
      await expect(page).toHaveURL(`${schedulePath}?tab=exceptions`);
    });
  });

  test.describe("west of UTC", () => {
    // URL dates are local calendar dates. Read as UTC midnight, they would
    // show the previous day here.
    test.use({ timezoneId: "America/Los_Angeles" });

    test("shows the bookmarked exception dates as written", async ({
      page,
    }) => {
      await page.goto(
        `${schedulePath}?${new URLSearchParams({
          tab: "exceptions",
          sheet: "add_exception",
          valid_from: "2099-03-15",
          valid_to: "2099-03-16",
        })}`,
      );

      const sheet = addExceptionSheet(page);
      await expect(sheet).toBeVisible();
      await expect(validPeriod(sheet)).toHaveText("Mar 15 – Mar 16, 2099");
    });
  });

  test("ignores invalid values in a bookmarked URL", async ({ page }) => {
    await page.goto(
      `${schedulePath}?${new URLSearchParams({
        tab: "bogus",
        sheet: "bogus",
        valid_from: "bogus",
      })}`,
    );
    // The router drops the invalid values when the page loads.
    await expect(page).not.toHaveURL(/bogus/);

    // The schedule view, with no sheet open.
    await expect(
      page.getByRole("button", { name: "Create Template", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Exceptions", exact: true }).click();

    await expect(page).toHaveURL(`${schedulePath}?tab=exceptions`);
  });
});
