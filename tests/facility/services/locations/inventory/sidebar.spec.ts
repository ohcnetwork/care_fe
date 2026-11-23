import { expect, test } from "@playwright/test";
import {
  createInventoryLocationViaApi,
  setLocationInventoryUsageViaApi,
} from "tests/helper/locations";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "shows Inventory and Pharmacy only when the location uses inventory",
  {
    tag: ["@atomic", "@cap:inventory.usage-gate.view"],
  },
  async ({ baseURL, page }) => {
    const facilityId = getFacilityId();
    const { locationId: id, payload } = await createInventoryLocationViaApi({
      facilityId,
      inventoryUsage: "consumption",
    });
    const { name } = payload;
    const bedsUrl = `/facility/${facilityId}/locations/${id}/beds`;
    const inventory = page.getByRole("button", {
      name: "Inventory",
      exact: true,
    });
    const pharmacy = page.getByRole("button", {
      name: "Pharmacy",
      exact: true,
    });

    await page
      .context()
      .addCookies([{ name: "sidebar:state", value: "true", url: baseURL }]);
    await page.goto(bedsUrl);
    await expect(inventory).toBeVisible();
    await expect(pharmacy).toBeVisible();

    await setLocationInventoryUsageViaApi({
      facilityId,
      locationId: id,
      payload,
      inventoryUsage: "none",
    });

    await page.reload();
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
    await expect(inventory).toHaveCount(0);
    await expect(pharmacy).toHaveCount(0);
  },
);
