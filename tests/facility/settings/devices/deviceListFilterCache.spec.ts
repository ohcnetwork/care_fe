import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The devices list opts in to the filters cache (`useFilters({ cache: true })`).
// Lists without the option, such as invoices, do not restore their filters.
test.describe("Device list filter cache", () => {
  let facilityId: string;

  test.beforeAll(() => {
    facilityId = getFacilityId();
  });

  test("restores the device search after the user leaves and returns", async ({
    page,
  }) => {
    const devicesUrl = `/facility/${facilityId}/settings/devices`;
    const searchText = faker.string.alpha({ length: 8, casing: "lower" });
    const searchBox = page.getByRole("textbox", { name: "Search devices..." });

    await test.step("Search the device list", async () => {
      await page.goto(devicesUrl);
      await searchBox.fill(searchText);
      await expect(page).toHaveURL(
        new RegExp(`[?&]search_text=${searchText}(&|$)`),
      );
    });

    await test.step("Leave the list", async () => {
      await page.goto(`/facility/${facilityId}/overview`);
      await expect(page).toHaveURL(/\/overview$/);
    });

    await test.step("Return without a query string", async () => {
      await page.goto(devicesUrl);
      await expect(page).toHaveURL(
        new RegExp(`[?&]search_text=${searchText}(&|$)`),
      );
      await expect(searchBox).toHaveValue(searchText);
    });
  });
});
