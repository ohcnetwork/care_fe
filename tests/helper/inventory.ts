import { expect, Page } from "@playwright/test";

const ORDER_UPDATE_PATH = /\/order\/(request|delivery)\/[^/]+\/$/;

/**
 * Runs `action` (e.g. clicking "Mark as Approved") and waits for the request
 * or delivery order update it triggers to succeed. Without this, a navigation
 * right after the click can abort the in-flight update and leave the order in
 * its previous status.
 */
export async function waitForOrderUpdate(
  page: Page,
  action: () => Promise<unknown>,
) {
  const response = page.waitForResponse(
    (res) =>
      res.request().method() === "PUT" &&
      ORDER_UPDATE_PATH.test(new URL(res.url()).pathname),
  );
  await action();
  expect((await response).ok()).toBeTruthy();
}
