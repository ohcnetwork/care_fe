import { expect, Page, test } from "@playwright/test";
import { openFacilityService } from "tests/helper/healthcareService";
import {
  approveStockRequestViaUi,
  createStockRequestViaUi,
  dispatchOrderViaUi,
  receiveDeliveryViaUi,
} from "tests/helper/inventory";

import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

// Fixture location ids, looked up once per worker.
let bioChemLabLocationId: string;
let pharmacyLocationId: string;
let bioChembasePath: string;
let pharmacybasePath: string;
let isInitialized: boolean = false;

test.describe("Facility To-Dispatch Orders Inventory Flow", () => {
  // Each test dispatches a stock request of its own, raised in beforeEach.
  let orderName: string;

  async function setupInitialData(page: Page) {
    if (isInitialized) return;
    const facilityId = getFacilityId();
    const servicesUrl = `/facility/${facilityId}/services/`;
    await openFacilityService(page, servicesUrl, "Main Pharmacy");
    await page.getByRole("link", { name: "Pharmacy" }).click();
    pharmacyLocationId =
      page
        .url()
        .match(
          new RegExp(
            `/facility/${facilityId}/locations/([^/]+)/medication_requests`,
          ),
        )?.[1] ?? "";
    pharmacybasePath = `/facility/${facilityId}/locations/${pharmacyLocationId}`;
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
    // Raising a stock request here, then order and delivery round trips in the
    // tests, can outlast 60s on a busy backend. Creating, approving, receiving
    // and completing a delivery overran 60s even before.
    test.slow();
    await setupInitialData(page);
    // The lab raises an approved stock request for the pharmacy to dispatch.
    ({ name: orderName } = await createStockRequestViaUi(page, {
      facilityId: getFacilityId(),
      locationId: bioChemLabLocationId,
    }));
    await approveStockRequestViaUi(page);
    await page.goto(bioChembasePath + "/inventory/internal/receive");
    // verify item appears in table
    const orderRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(orderRow.first()).toBeVisible();
    await expect(orderRow.first()).toContainText("Pharmacy");
  });

  test(
    "switch location and create delivery order",
    { tag: ["@atomic", "@cap:inventory.order.dispatch"] },
    async ({ page }) => {
      await dispatchOrderViaUi(page, {
        facilityId: getFacilityId(),
        locationId: pharmacyLocationId,
        orderName,
      });
      await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
      await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
      const deliveryRow = page
        .locator("table tbody tr")
        .filter({ hasText: orderName });
      await expect(deliveryRow.first()).toBeVisible();
    },
  );

  test(
    "approve incoming delivery order",
    {
      tag: ["@journey", "@cap:inventory.delivery.receive"],
      annotation: {
        type: "journey",
        description:
          "inventory.order.dispatch -> inventory.delivery.receive (receive stock, then complete the delivery)",
      },
    },
    async ({ page }) => {
      await dispatchOrderViaUi(page, {
        facilityId: getFacilityId(),
        locationId: pharmacyLocationId,
        orderName,
      });
      await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
      await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
      const deliveryRow = page
        .locator("table tbody tr")
        .filter({ hasText: orderName });
      await expect(deliveryRow.first()).toBeVisible();

      await receiveDeliveryViaUi(page, {
        facilityId: getFacilityId(),
        locationId: bioChemLabLocationId,
        orderName,
      });

      await page.goto(bioChembasePath + "/inventory/internal/receive");
      await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
      await page.getByRole("tab", { name: "Completed" }).click();
      const completedDeliveryRow = page
        .locator("table tbody tr")
        .filter({ hasText: orderName });
      await expect(completedDeliveryRow.first()).toBeVisible();
    },
  );
});
