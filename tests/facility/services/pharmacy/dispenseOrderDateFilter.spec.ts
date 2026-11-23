import { expect, test, type Page } from "@playwright/test";

import {
  openServiceLocation,
  waitForListRequest,
} from "tests/facility/services/helpers";
import {
  applyCustomDateFilterRange,
  applyDateFilterPreset,
  clearSelectedMultiFilter,
} from "tests/helper/multiFilter";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The dispense order API filters `created_date` as a datetime range. The page
// keeps calendar days (`yyyy-MM-dd`) in the URL, and sends the start of the
// first day and the start of the day after the last day, in the timezone of
// the browser. A bare date would mean midnight at the start of that day, which
// leaves out the last day, and makes a single day an empty range.

const DISPENSE_ORDERS = "/order/dispense/";
const PENDING_STATUSES = "draft,in_progress";
const HISTORY_STATUSES = "completed,entered_in_error,abandoned";

let pharmacyPath: string;

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    storageState: "tests/.auth/user.json",
  });
  const page = await context.newPage();
  pharmacyPath = await openServiceLocation(
    page,
    getFacilityId(),
    "Main Pharmacy",
    "Pharmacy",
  );
  await context.close();
});

const listUrl = (search: Record<string, string> = {}) => {
  const query = new URLSearchParams(search).toString();
  return `${pharmacyPath}/medication_dispense${query ? `?${query}` : ""}`;
};

interface DateBounds {
  after?: string;
  before?: string;
}

/** Waits for a dispense order request with exactly these date bounds. */
function waitForDateBounds(
  page: Page,
  { after, before }: DateBounds,
  status = PENDING_STATUSES,
) {
  return waitForListRequest(
    page,
    DISPENSE_ORDERS,
    (params) =>
      params.get("status") === status &&
      params.get("created_date_after") === (after ?? null) &&
      params.get("created_date_before") === (before ?? null),
  );
}

/** Local midnight of today and of tomorrow, in the timezone of the page. */
function todayBounds(page: Page): Promise<Required<DateBounds>> {
  return page.evaluate(() => {
    const now = new Date();
    const day = (offset: number) =>
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset,
      ).toISOString();
    return { after: day(0), before: day(1) };
  });
}

const TIMEZONES = [
  {
    timezoneId: "Asia/Kolkata",
    range: {
      after: "2026-01-09T18:30:00.000Z",
      before: "2026-01-13T18:30:00.000Z",
    },
    singleDay: {
      after: "2026-01-12T18:30:00.000Z",
      before: "2026-01-13T18:30:00.000Z",
    },
  },
  {
    timezoneId: "UTC",
    range: {
      after: "2026-01-10T00:00:00.000Z",
      before: "2026-01-14T00:00:00.000Z",
    },
    singleDay: {
      after: "2026-01-13T00:00:00.000Z",
      before: "2026-01-14T00:00:00.000Z",
    },
  },
  {
    timezoneId: "America/New_York",
    range: {
      after: "2026-01-10T05:00:00.000Z",
      before: "2026-01-14T05:00:00.000Z",
    },
    singleDay: {
      after: "2026-01-13T05:00:00.000Z",
      before: "2026-01-14T05:00:00.000Z",
    },
  },
];

for (const { timezoneId, range, singleDay } of TIMEZONES) {
  test.describe(`Dispense order date filter in ${timezoneId}`, () => {
    test.use({ timezoneId });

    test("includes the whole last day of a bookmarked range", async ({
      page,
    }) => {
      const request = waitForDateBounds(page, range);
      await page.goto(
        listUrl({
          created_date_after: "2026-01-10",
          created_date_before: "2026-01-13",
        }),
      );
      await request;
    });

    test("sends a whole day when the range is a single day", async ({
      page,
    }) => {
      const request = waitForDateBounds(page, singleDay);
      await page.goto(
        listUrl({
          created_date_after: "2026-01-13",
          created_date_before: "2026-01-13",
        }),
      );
      await request;
    });

    test("sends only the start when only the start date is set", async ({
      page,
    }) => {
      const request = waitForDateBounds(page, { after: range.after });
      await page.goto(listUrl({ created_date_after: "2026-01-10" }));
      await request;
    });

    test("sends only the end when only the end date is set", async ({
      page,
    }) => {
      const request = waitForDateBounds(page, { before: range.before });
      await page.goto(listUrl({ created_date_before: "2026-01-13" }));
      await request;
    });

    test("sends today from midnight to midnight for the Today preset", async ({
      page,
    }) => {
      const unfiltered = waitForDateBounds(page, {});
      await page.goto(listUrl());
      await unfiltered;

      const request = waitForDateBounds(page, await todayBounds(page));
      await applyDateFilterPreset(page, /^date$/i, /^today$/i);
      await request;
    });
  });
}

test.describe("Dispense order date filter across daylight saving changes", () => {
  test.use({ timezoneId: "America/New_York" });

  test("ends the range at midnight after clocks go forward", async ({
    page,
  }) => {
    // Clocks go forward on 8 March 2026: that day has 23 hours.
    const request = waitForDateBounds(page, {
      after: "2026-03-07T05:00:00.000Z",
      before: "2026-03-09T04:00:00.000Z",
    });
    await page.goto(
      listUrl({
        created_date_after: "2026-03-07",
        created_date_before: "2026-03-08",
      }),
    );
    await request;
  });

  test("ends the range at midnight after clocks go back", async ({ page }) => {
    // Clocks go back on 1 November 2026: that day has 25 hours.
    const request = waitForDateBounds(page, {
      after: "2026-10-31T04:00:00.000Z",
      before: "2026-11-02T05:00:00.000Z",
    });
    await page.goto(
      listUrl({
        created_date_after: "2026-10-31",
        created_date_before: "2026-11-01",
      }),
    );
    await request;
  });
});

test.describe("Dispense order date filter", () => {
  test.use({ timezoneId: "Asia/Kolkata" });

  test("applies the date range on the history tab", async ({ page }) => {
    const request = waitForDateBounds(
      page,
      TIMEZONES[0].range,
      HISTORY_STATUSES,
    );
    await page.goto(
      listUrl({
        exclude_status: "history",
        created_date_after: "2026-01-10",
        created_date_before: "2026-01-13",
      }),
    );
    await request;
  });

  test("writes a custom range to the URL and sends its whole last day", async ({
    page,
  }) => {
    const unfiltered = waitForDateBounds(page, {});
    await page.goto(listUrl());
    await unfiltered;

    const request = waitForDateBounds(page, TIMEZONES[0].range);
    await applyCustomDateFilterRange(
      page,
      /^date$/i,
      "2026-01-10",
      "2026-01-13",
    );
    await request;

    await expect(page).toHaveURL(/[?&]created_date_after=2026-01-10(&|$)/);
    await expect(page).toHaveURL(/[?&]created_date_before=2026-01-13(&|$)/);
  });

  test("drops both bounds when the date filter is cleared", async ({
    page,
  }) => {
    const filtered = waitForDateBounds(page, TIMEZONES[0].range);
    await page.goto(
      listUrl({
        created_date_after: "2026-01-10",
        created_date_before: "2026-01-13",
      }),
    );
    await filtered;

    const request = waitForDateBounds(page, {});
    await clearSelectedMultiFilter(page, /^date$/i);
    await request;

    await expect(page).not.toHaveURL(/created_date_(after|before)=/);
  });
});
