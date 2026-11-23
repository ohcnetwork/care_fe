import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  openServiceLocation,
  waitForListRequest,
} from "tests/facility/services/helpers";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// A medication return opens with `dispenseOrderIds`: the dispense orders that
// the medicines return from. The return page reads it with a typed search
// schema (`medicationReturnShowSearch` in `src/lib/router/search/pharmacy.ts`)
// and requests the dispensed medicines of each order. The requests do not
// depend on the return or the orders existing, so the test needs no data.

test("the return page requests the dispenses of the orders in the URL", async ({
  page,
}) => {
  const pharmacyPath = await openServiceLocation(
    page,
    getFacilityId(),
    "Main Pharmacy",
    "Pharmacy",
  );
  const returnId = faker.string.uuid();
  const orderIds = [faker.string.uuid(), faker.string.uuid()];
  const dispenses = orderIds.map((orderId) =>
    waitForListRequest(
      page,
      "/medication/dispense/",
      (params) => params.get("order") === orderId,
    ),
  );

  await page.goto(
    `${pharmacyPath}/medication_return/order/${returnId}?dispenseOrderIds=${orderIds.join(",")}`,
  );

  await Promise.all(dispenses);
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("dispenseOrderIds") === orderIds.join(","),
  );
});
