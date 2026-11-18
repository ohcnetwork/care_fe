import { expect, Page } from "@playwright/test";

import type { DeliveryOrderStatus } from "@/types/inventory/deliveryOrder/deliveryOrder";
import type { RequestOrderStatus } from "@/types/inventory/requestOrder/requestOrder";

const ORDER_UPDATE_PATH = /\/order\/(request|delivery)\/[^/]+\/$/;

/**
 * Runs `action` (e.g. clicking "Mark as Approved") and waits for the request
 * or delivery order update that moves the order to `status` to succeed.
 * Without this, a navigation right after the click can abort the in-flight
 * update and leave the order in its previous status.
 */
export async function waitForOrderUpdate(
  page: Page,
  status: `${RequestOrderStatus}` | `${DeliveryOrderStatus}`,
  action: () => Promise<unknown>,
) {
  // Start listening before triggering the action, otherwise a fast response
  // can arrive before the listener exists and the wait never resolves.
  const response = page.waitForResponse(
    (res) =>
      res.request().method() === "PUT" &&
      ORDER_UPDATE_PATH.test(new URL(res.url()).pathname) &&
      res.request().postDataJSON()?.status === status,
  );
  await action();
  // `toBeOK()` only accepts APIResponse, so surface the status and body here.
  const res = await response;
  expect(
    res.ok(),
    `Order update to "${status}" failed: ${res.status()} ${await res.text()}`,
  ).toBe(true);
}
