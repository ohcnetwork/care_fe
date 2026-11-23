import { expect, type Page } from "@playwright/test";

/**
 * TanStack Router's position in the session history. The router keeps it in
 * `history.state.__TSR_index`: a push adds 1, a replace keeps it, and a real
 * back goes down.
 */
export function historyIndex(page: Page) {
  return page.evaluate(
    () =>
      (window.history.state as { __TSR_index?: number } | null)?.__TSR_index,
  );
}

/**
 * Matches a URL by its path. List pages add their default filters to the
 * query when they load.
 */
export function atPath(path: string) {
  return (url: URL) => url.pathname === path;
}

/** Waits until the router is at history position `index`. */
export async function expectHistoryIndex(page: Page, index: number) {
  await expect.poll(() => historyIndex(page)).toBe(index);
}

/**
 * Navigates in the app the way a link does (a push), for pages no link
 * reaches, such as a record that does not exist.
 */
export async function navigateInApp(page: Page, href: string) {
  await page.waitForFunction(() => "__TSR_ROUTER__" in window);
  await page.evaluate(async (target) => {
    const router = (
      window as unknown as {
        __TSR_ROUTER__: { navigate: (options: { href: string }) => unknown };
      }
    ).__TSR_ROUTER__;
    await router.navigate({ href: target });
  }, href);
}
