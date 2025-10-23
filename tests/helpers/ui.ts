import type { Locator, Page } from "@playwright/test";

interface SelectFromCommandOptions {
  search?: string;
  option?: number | "first" | "last";
  placeholder?: RegExp | string;
  closeAfterSelect?: boolean;
}

export async function selectFromCommand(
  page: Page,
  trigger: Locator,
  {
    search,
    option = "first",
    placeholder,
    closeAfterSelect = false,
  }: SelectFromCommandOptions = {},
) {
  await trigger.waitFor({ state: "visible" });
  // Defensive: close any previously visible popover/dialog that might intercept clicks
  try {
    await trigger.click({ trial: true });
  } catch {
    // If intercepted, try closing any overlay once and retry
    const popper = page.locator("[data-radix-popper-content-wrapper]");
    if (
      await popper
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await page.keyboard.press("Escape").catch(() => {});
      await popper
        .first()
        .waitFor({ state: "hidden", timeout: 1000 })
        .catch(() => {});
    }
  }
  await trigger.click();

  // Prefer semantic roles/placeholders first (Dialog/Drawer or Popover)
  // Some selectors render PopoverContent (not role=dialog). Use either dialog or
  // the nearest popper content wrapper after clicking.
  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;

  const input =
    placeholder !== undefined
      ? scope.getByPlaceholder(placeholder)
      : scope.locator('[data-slot="command-input"]').first();

  if (await input.isVisible().catch(() => false)) {
    if (search !== undefined) {
      await input.fill("");
      await input.fill(String(search));
      // If the UI shows a transient "Searching" state, wait for it to settle
      const searching = scope.getByText(/searching/i);
      await searching.waitFor({ state: "hidden" }).catch(() => {});
    }
  }

  // Some components render CommandGroup/CommandItem without CommandList.
  // Prefer waiting for any option to appear within the open scope.
  let items = scope.getByRole("option");

  // First try within the scoped container; if it doesn't appear quickly,
  // fall back to page-level options (some implementations render differently).
  const scopedWait = items
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .catch(() => null);

  await scopedWait;

  if (
    !(await items
      .first()
      .isVisible()
      .catch(() => false))
  ) {
    items = page.getByRole("option");
    await items.first().waitFor({ state: "visible" });
  }

  let count = await items.count();
  if (!count) throw new Error("No options found in command list");

  const index =
    option === "first" ? 0 : option === "last" ? count - 1 : Number(option);

  if (Number.isNaN(index) || index < 0 || index >= count) {
    throw new Error(
      `Option index ${String(option)} out of bounds (0..${count - 1})`,
    );
  }

  // Click with retry to tolerate re-render/detach during selection
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await items.nth(index).click();
      break;
    } catch (err) {
      // If detached/not stable, re-resolve locators and retry
      const message = (err as Error)?.message || "";
      if (
        message.includes("detached") ||
        message.includes("not stable") ||
        message.includes("Element is not attached")
      ) {
        await page.waitForTimeout(100);
        items = scope.getByRole("option");
        count = await items.count();
        if (!count) throw err;
        continue;
      }
      throw err;
    }
  }

  if (closeAfterSelect) {
    await page.keyboard.press("Escape");
    // Ensure overlay is gone before proceeding
    const popperAfter = page.locator("[data-radix-popper-content-wrapper]");
    await popperAfter
      .first()
      .waitFor({ state: "hidden", timeout: 1000 })
      .catch(() => {});
  }
}

export async function selectFromLocationMultiSelect(
  page: Page,
  trigger: Locator,
  {
    search,
    index = 0,
    closeAfterSelect = true,
  }: { search?: string; index?: number; closeAfterSelect?: boolean } = {},
) {
  await trigger.waitFor({ state: "visible" });
  await trigger.scrollIntoViewIfNeeded?.();
  await trigger.click();

  const scope = page
    .locator("[role='dialog'], [data-radix-popper-content-wrapper]")
    .last();
  await scope.waitFor();

  if (search) {
    const input = scope.getByPlaceholder(/search locations/i);
    if (await input.isVisible().catch(() => false)) {
      await input.fill("");
      await input.fill(search);
    }
  }

  const plusButtons = scope.locator("button:has(svg.lucide-plus)");
  await plusButtons.first().waitFor({ state: "visible" });
  await plusButtons.nth(index).click();

  if (closeAfterSelect) {
    // Try to close via focused scope first; fallback to toggling the trigger
    await scope.press("Escape").catch(() => {});
    const waitHidden = scope
      .waitFor({ state: "hidden", timeout: 1000 })
      .catch(() => null);
    await waitHidden;
    const stillVisible = await scope.isVisible().catch(() => false);
    if (stillVisible) {
      // Fallback: click the trigger again to toggle close
      await trigger.click().catch(() => {});
      await scope.waitFor({ state: "hidden", timeout: 1000 }).catch(() => {});
    }
  }
}

export async function closeAnyOpenPopovers(page: Page) {
  const poppers = page.locator("[data-radix-popper-content-wrapper]");
  for (let i = 0; i < 3; i += 1) {
    const visible = await poppers
      .first()
      .isVisible()
      .catch(() => false);
    if (!visible) break;
    await page.keyboard.press("Escape").catch(() => {});
    await poppers
      .first()
      .waitFor({ state: "hidden", timeout: 1000 })
      .catch(() => {});
  }
}
