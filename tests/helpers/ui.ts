import type { Locator, Page } from "@playwright/test";

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

interface SelectFromRequirementsOptions {
  search?: string;
  itemIndex?: number;
}

/**
 * Helper for RequirementsSelector component (multi-select with Plus buttons)
 *
 * This component uses a Command interface where each option has a Plus button that must be clicked.
 * It's used for specimen requirements, observation requirements, etc.
 *
 * Key behavior:
 * - Multi-select (doesn't auto-close)
 * - Each option has a Plus button (button:has(svg.lucide-plus))
 * - Shows selected items count in trigger
 *
 * @example
 * await selectFromRequirements(page, specimenTrigger, { itemIndex: 0 });
 */
export async function selectFromRequirements(
  page: Page,
  trigger: Locator,
  { search, itemIndex = 0 }: SelectFromRequirementsOptions = {},
) {
  await trigger.waitFor({ state: "visible" });
  await trigger.scrollIntoViewIfNeeded?.();

  // Close any existing popovers before opening
  await closeAnyOpenPopovers(page);

  await trigger.click();

  // Wait for the picker to open (could be dialog or popover)
  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;

  await scope.waitFor({ state: "visible", timeout: 5000 });

  // If search is provided, use the search input
  if (search) {
    const input = scope.locator('[data-slot="command-input"]').first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill("");
      await input.fill(search);
      await page.waitForTimeout(500); // Wait for debounced search
    }
  }

  // Wait for options to load
  const options = scope.getByRole("option");
  await options.first().waitFor({ state: "visible", timeout: 10000 });

  const count = await options.count();
  if (count === 0) {
    throw new Error("No options found in requirements selector");
  }

  // Find the Plus button inside the option at the specified index
  const targetOption = options.nth(itemIndex);
  const plusButton = targetOption.locator("button:has(svg.lucide-plus)");

  // Wait for the plus button and click it
  await plusButton.waitFor({ state: "visible", timeout: 5000 });
  await plusButton.click();

  // Wait for selection to register (multi-select, so it stays open)
  await page.waitForTimeout(300);
}

interface SelectFromValueSetOptions {
  search?: string;
  itemIndex?: number;
  tab?: "search" | "starred";
}

/**
 * Helper for ValueSetSelect component (single-select with search and favorites)
 *
 * This component uses ValueSetSearchContent with Command + Tabs (Search/Starred).
 * It's used for code selection like body site, diagnostic codes, etc.
 *
 * Key behavior:
 * - Single selection (auto-closes after select)
 * - Has Search and Starred tabs (mobile)
 * - Options are directly clickable CommandItems
 * - Shows "Searching..." state while loading
 *
 * @example
 * await selectFromValueSet(page, codeTrigger, { search: "test", itemIndex: 0 });
 */
export async function selectFromValueSet(
  page: Page,
  trigger: Locator,
  { search, itemIndex = 0, tab = "search" }: SelectFromValueSetOptions = {},
) {
  await trigger.waitFor({ state: "visible" });
  await trigger.scrollIntoViewIfNeeded?.();

  // Close any existing popovers before opening
  await closeAnyOpenPopovers(page);

  await trigger.click();

  // Wait for the picker to open (could be dialog or popover)
  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;

  await scope.waitFor({ state: "visible", timeout: 5000 });

  // Switch tabs if needed (mainly for mobile, but won't hurt on desktop)
  if (tab === "starred") {
    const starredTab = scope.getByRole("tab", { name: /starred/i });
    if (await starredTab.isVisible().catch(() => false)) {
      await starredTab.click();
      await page.waitForTimeout(200);
    }
  }

  // If search is provided, use the search input
  if (search) {
    const input = scope.locator('[data-slot="command-input"]').first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill("");
      await input.fill(search);

      // Wait for "Searching..." to appear and disappear
      const searching = scope.getByText(/searching/i);
      if (await searching.isVisible().catch(() => false)) {
        await searching.waitFor({ state: "hidden", timeout: 10000 });
      }

      // Additional wait for debounced results
      await page.waitForTimeout(500);
    }
  }

  // Wait for options to load
  const options = scope.getByRole("option");
  await options.first().waitFor({ state: "visible", timeout: 10000 });

  const count = await options.count();
  if (count === 0) {
    throw new Error("No options found in value set selector");
  }

  // Click the option directly (not a button inside it)
  const targetOption = options.nth(itemIndex);
  await targetOption.click();

  // Auto-closes on selection, so wait for it to close
  await scope.waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
}

interface SelectFromCategoryPickerOptions {
  search?: string;
  navigateCategories?: string[]; // Array of category titles to navigate through
  itemIndex?: number; // Index of item to select (default: 0)
  closeAfterSelect?: boolean;
}

/**
 * Helper for ResourceDefinitionCategoryPicker with hierarchical category navigation
 * This picker allows navigating through categories (folders) before selecting items
 */
export async function selectFromCategoryPicker(
  page: Page,
  trigger: Locator,
  {
    search,
    navigateCategories = [],
    itemIndex = 0,
    closeAfterSelect = false,
  }: SelectFromCategoryPickerOptions = {},
) {
  await trigger.waitFor({ state: "visible" });
  await trigger.scrollIntoViewIfNeeded?.();

  // Close any existing popovers before opening
  await closeAnyOpenPopovers(page);

  await trigger.click();

  // Wait for the picker to open (could be dialog or popover)
  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;

  await scope.waitFor({ state: "visible", timeout: 5000 });

  // Navigate through categories if specified
  for (const categoryTitle of navigateCategories) {
    // Wait for the category to appear
    const categoryItem = scope.getByRole("option", {
      name: new RegExp(categoryTitle, "i"),
    });
    await categoryItem.waitFor({ state: "visible" });
    await categoryItem.click();

    // Wait for navigation to complete
    await page.waitForTimeout(300);
  }

  // If search is provided, use search instead of navigation
  if (search) {
    const input = scope.locator('[data-slot="command-input"]').first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill("");
      await input.fill(search);
      await page.waitForTimeout(500); // Wait for debounced search
    }
  }

  // Wait for items to load - items should be visible after category navigation or search
  // Items in this picker don't have icons like folders, so they appear after navigation
  const items = scope.getByRole("option");
  await items.first().waitFor({ state: "visible", timeout: 10000 });

  const count = await items.count();
  if (count === 0) {
    throw new Error("No items found in category picker");
  }

  // If navigating through categories, we might see both folders and items
  // We want to select an item, not a folder
  // Items typically don't have ChevronRight icon
  let targetItem = items.nth(itemIndex);

  // Check if the item has a chevron (indicates it's a folder/category)
  const hasChevron = await targetItem
    .locator("svg.lucide-chevron-right")
    .isVisible()
    .catch(() => false);

  if (hasChevron && navigateCategories.length === 0) {
    // If no categories specified but we found a folder, click into it first
    await targetItem.click();
    await page.waitForTimeout(300);

    // Now select the first item in this category
    const newItems = scope.getByRole("option");
    await newItems.first().waitFor({ state: "visible" });
    targetItem = newItems.nth(itemIndex);
  }

  // Click the item to select it
  await targetItem.click();

  if (closeAfterSelect) {
    await page.keyboard.press("Escape");
    await scope.waitFor({ state: "hidden", timeout: 1000 }).catch(() => {});
  } else {
    // For multi-select, just wait a bit for the selection to register
    await page.waitForTimeout(200);
  }
}
