import { expect, Page, test } from "@playwright/test";
import { openFacilityService } from "tests/helper/healthcareService";
import {
  approveStockRequestViaUi,
  completeStockRequestViaUi,
  createStockRequestViaUi,
} from "tests/helper/inventory";

import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

let bioChemLabLocationId: string;
let bioChembasePath: string;
let isInitialized: boolean = false;

test.describe("Facility To-Receive Orders Inventory Flow", () => {
  async function setupInitialData(page: Page) {
    if (isInitialized) return;
    const facilityId = getFacilityId();
    const servicesUrl = `/facility/${facilityId}/services/`;
    await openFacilityService(page, servicesUrl, "Main Pharmacy");
    await page.getByRole("link", { name: "Pharmacy" }).click();
    await openFacilityService(page, servicesUrl, "Pathology Lab");
    await page.getByRole("link", { name: "Bio-Chemistry" }).click();
    bioChemLabLocationId =
      page
        .url()
        .match(
          new RegExp(
            `/facility/${facilityId}/locations/([^/]+)/service_requests`,
          ),
        )?.[1] ?? "";
    bioChembasePath = `/facility/${facilityId}/locations/${bioChemLabLocationId}`;
    isInitialized = true;
  }

  test.beforeEach(async ({ page }) => {
    await setupInitialData(page);
  });

  test(
    "raise new stock request and mark as approved",
    { tag: ["@atomic", "@cap:inventory.stockrequest.create"] },
    async ({ page }) => {
      // Opens the To Receive page of the lab and raises the request there.
      const { name: orderName } = await createStockRequestViaUi(page, {
        facilityId: getFacilityId(),
        locationId: bioChemLabLocationId,
      });
      await approveStockRequestViaUi(page);
      await page.goto(bioChembasePath + "/inventory/internal/receive");
      // verify item appears in table
      const orderRow = page
        .locator("table tbody tr")
        .filter({ hasText: orderName });
      await expect(orderRow.first()).toBeVisible();
      await expect(orderRow.first()).toContainText("Pharmacy");
    },
  );

  test(
    "mark stock request as completed",
    { tag: ["@atomic", "@cap:inventory.stockrequest.complete"] },
    async ({ page }) => {
      const { name: orderName } = await createStockRequestViaUi(page, {
        facilityId: getFacilityId(),
        locationId: bioChemLabLocationId,
      });
      await approveStockRequestViaUi(page);
      await completeStockRequestViaUi(page);
      await page.goto(bioChembasePath + "/inventory/internal/receive");
      await page.getByRole("tab", { name: "Completed" }).click();
      // verify item appears in table
      const orderRow = page
        .locator("table tbody tr")
        .filter({ hasText: orderName });
      await expect(orderRow.first()).toBeVisible();
      await expect(orderRow.first()).toContainText("Pharmacy");
    },
  );
});
