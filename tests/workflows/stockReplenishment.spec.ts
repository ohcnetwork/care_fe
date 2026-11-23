import { faker } from "@faker-js/faker";
import { openServiceLocation } from "tests/helper/healthcareService";
import {
  approveStockRequestViaUi,
  completeStockRequestViaUi,
  createStockRequestViaUi,
  dispatchOrderViaUi,
  receiveDeliveryViaUi,
} from "tests/helper/inventory";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test(
  "a lab's stock request is approved, dispatched by the pharmacy, received at the lab and closed",
  { tag: ["@workflow", "@cap:workflow.stock-replenishment"] },
  async ({ page, request, facilityId }) => {
    // Raising, approving, dispatching, receiving and closing an order chains
    // several order round trips; the dispatch-and-receive journey alone needs
    // test.slow() (tests/facility/services/locations/inventory/toDispatch.spec.ts).
    test.setTimeout(240_000);

    // The fixture locations, found from their services as the inventory specs
    // do: the Pharmacy supplies, the Bio-Chemistry Lab requests and receives.
    const pharmacyPath = await openServiceLocation(
      page,
      facilityId,
      "Main Pharmacy",
      "Pharmacy",
    );
    const labPath = await openServiceLocation(
      page,
      facilityId,
      "Pathology Lab",
      "Bio-Chemistry",
    );
    const pharmacyLocationId = pharmacyPath.split("/locations/")[1];
    const labLocationId = labPath.split("/locations/")[1];

    const { requestOrderId, name: orderName } = await createStockRequestViaUi(
      page,
      {
        facilityId,
        locationId: labLocationId,
        name: `Workflow restock ${faker.string.alphanumeric(10)}`,
        supplierLocation: "Pharmacy",
      },
    );
    await approveStockRequestViaUi(page);

    const { deliveryOrderId } = await dispatchOrderViaUi(page, {
      facilityId,
      locationId: pharmacyLocationId,
      orderName,
    });

    await test.step("The pharmacy lists the outgoing delivery", async () => {
      await page.goto(`${pharmacyPath}/inventory/internal/dispatch`);
      await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
      await expect(
        page.locator("table tbody tr").filter({ hasText: orderName }).first(),
      ).toBeVisible();
    });

    await receiveDeliveryViaUi(page, {
      facilityId,
      locationId: labLocationId,
      orderName,
    });

    // Receiving completes the delivery only; the lab closes its request.
    await page.goto(
      `${labPath}/inventory/internal/receive/orders/${requestOrderId}`,
    );
    await expect(page.getByRole("heading", { name: orderName })).toBeVisible();
    await completeStockRequestViaUi(page);

    await test.step("The request and its delivery end completed", async () => {
      const headers = getApiHeaders();
      const requestOrder = await request.get(
        `${getApiUrl()}/api/v1/facility/${facilityId}/order/request/${requestOrderId}/`,
        { headers },
      );
      expect(requestOrder.ok(), await requestOrder.text()).toBe(true);
      expect(await requestOrder.json()).toMatchObject({
        name: orderName,
        status: "completed",
      });
      const deliveryOrder = await request.get(
        `${getApiUrl()}/api/v1/facility/${facilityId}/order/delivery/${deliveryOrderId}/`,
        { headers },
      );
      expect(deliveryOrder.ok(), await deliveryOrder.text()).toBe(true);
      expect(await deliveryOrder.json()).toMatchObject({
        status: "completed",
      });
    });

    await test.step("The lab lists the request and the delivery as completed", async () => {
      await page.goto(`${labPath}/inventory/internal/receive`);
      await page.getByRole("tab", { name: "Completed" }).click();
      const requestRow = page
        .locator("table tbody tr")
        .filter({ hasText: orderName })
        .first();
      await expect(requestRow).toBeVisible();
      await expect(requestRow).toContainText("Pharmacy");

      await page.goto(`${labPath}/inventory/internal/receive`);
      await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
      await page.getByRole("tab", { name: "Completed" }).click();
      await expect(
        page.locator("table tbody tr").filter({ hasText: orderName }).first(),
      ).toBeVisible();
    });
  },
);
