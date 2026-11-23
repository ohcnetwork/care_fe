import { expect, test } from "@playwright/test";
import {
  createInventoryLocationViaApi,
  setLocationInventoryUsageViaApi,
} from "tests/helper/locations";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "opens Inventory and Pharmacy only when the location uses inventory",
  {
    tag: ["@atomic", "@cap:inventory.usage-gate.view"],
  },
  async ({ page }) => {
    const facilityId = getFacilityId();
    const { locationId: id, payload } = await createInventoryLocationViaApi({
      facilityId,
      inventoryUsage: "none",
    });
    const basePath = `/facility/${facilityId}/locations/${id}`;
    const heading = (name: string) =>
      page.getByRole("heading", { name, exact: true });
    const unavailable = heading("Inventory and pharmacy aren't available here");

    await test.step("Blocks Inventory and Pharmacy when usage is None", async () => {
      for (const path of [
        "/inventory/summary",
        "/inventory/internal/dispatch",
        "/inventory/internal/receive/orders/new",
        "/inventory/internal/receive/deliveries/new",
        "/medication_requests",
        "/medication_dispense",
        "/medication_return",
      ]) {
        await page.goto(basePath + path);
        await expect(unavailable, path).toBeVisible();
      }
    });

    await test.step("Keeps To Receive open when usage is None", async () => {
      await page.goto(`${basePath}/inventory/internal/receive`);
      await expect(heading("To Receive")).toBeVisible();
      await expect(unavailable).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Raise Stock Request" }),
      ).toHaveCount(0);
    });

    await test.step("Opens Inventory but not External Supply for Consumption", async () => {
      await setLocationInventoryUsageViaApi({
        facilityId,
        locationId: id,
        payload,
        inventoryUsage: "consumption",
      });

      await page.goto(`${basePath}/inventory/internal/dispatch`);
      await expect(heading("To Dispatch")).toBeVisible();
      await expect(unavailable).toHaveCount(0);

      await page.goto(`${basePath}/inventory/external/orders/outgoing`);
      await expect(
        heading("External supply isn't available here"),
      ).toBeVisible();
    });
  },
);
