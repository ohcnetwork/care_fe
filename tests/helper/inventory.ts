import { expect, Page } from "@playwright/test";

const ORDER_UPDATE_PATH = /\/order\/(request|delivery)\/[^/]+\/$/;

/**
 * Status an order is expected to move to: "pending" when approved,
 * "completed" when marked as completed. Kept independent of src so the test
 * states the expected behaviour instead of following the app's definitions.
 */
type OrderStatusUpdate = "pending" | "completed";

/**
 * Runs `action` (e.g. clicking "Mark as Approved") and waits for the request
 * or delivery order update that moves the order to `status` to succeed.
 * Without this, a navigation right after the click can abort the in-flight
 * update and leave the order in its previous status.
 */
export async function waitForOrderUpdate(
  page: Page,
  status: OrderStatusUpdate,
  action: () => Promise<unknown>,
) {
  // The response wait is created before the action runs (array order), so a
  // fast response cannot arrive before the listener exists. Awaiting both
  // together also handles the wait's rejection if the action itself fails.
  const [res] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.request().method() === "PUT" &&
        ORDER_UPDATE_PATH.test(new URL(res.url()).pathname) &&
        res.request().postDataJSON()?.status === status,
    ),
    action(),
  ]);
  if (!res.ok()) {
    // `toBeOK()` only accepts APIResponse, so surface the status and body here.
    const body = await res.text().catch(() => "(body unavailable)");
    expect(
      res.ok(),
      `Order update to "${status}" failed: ${res.status()} ${body}`,
    ).toBe(true);
  }
}
