import { expect, type Locator, type Page } from "@playwright/test";

export async function selectFromLocationMultiSelect(
  page: Page,
  trigger: Locator,
  {
    search,
    itemIndex = 0,
    closeAfterSelect = true,
  }: { search?: string; itemIndex?: number; closeAfterSelect?: boolean } = {},
) {
  await trigger.waitFor({ state: "visible" });
  await trigger.scrollIntoViewIfNeeded();
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
  await plusButtons.nth(itemIndex).click();

  if (closeAfterSelect) {
    // Try to close via focused scope first; fallback to toggling the trigger
    await scope.press("Escape").catch(() => {});
    const waitHidden = scope.waitFor({ state: "hidden" }).catch(() => null);
    await waitHidden;
    const stillVisible = await scope.isVisible().catch(() => false);
    if (stillVisible) {
      // Fallback: click the trigger again to toggle close
      await trigger.click().catch(() => {});
      await scope.waitFor({ state: "hidden" }).catch(() => {});
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
      .waitFor({ state: "hidden" })
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
  await trigger.scrollIntoViewIfNeeded();

  // Close any existing popovers before opening
  await closeAnyOpenPopovers(page);

  await trigger.click();

  // Wait for the picker to open (could be dialog or popover)
  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;

  await scope.waitFor({ state: "visible" });

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
  await options.first().waitFor({ state: "visible" });

  const count = await options.count();
  if (count === 0) {
    throw new Error("No options found in requirements selector");
  }

  // Find the Plus button inside the option at the specified itemIndex
  const targetOption = options.nth(itemIndex);
  const plusButton = targetOption.locator("button:has(svg.lucide-plus)");

  // Wait for the plus button and click it
  await plusButton.waitFor({ state: "visible" });
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
  await trigger.scrollIntoViewIfNeeded();

  // Close any existing popovers before opening
  await closeAnyOpenPopovers(page);

  await trigger.click();

  // Wait for the picker to open (could be dialog or popover)
  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;

  await scope.waitFor({ state: "visible" });

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
        await searching.waitFor({ state: "hidden" });
      }
    }
  }

  // Wait for options to load
  const options = scope.getByRole("option");
  await options.first().waitFor({ state: "visible" });

  const count = await options.count();
  if (count === 0) {
    throw new Error("No options found in value set selector");
  }

  // Click the option directly (not a button inside it)
  const targetOption = options.nth(itemIndex);
  await targetOption.click();

  // Auto-closes on selection, so wait for it to close
  await scope.waitFor({ state: "hidden" }).catch(() => {});
}

interface SelectFromCommandOptions {
  search?: string;
  itemIndex?: number;
}

/**
 * Generic helper for selecting from a Command component inside a Popover or Drawer.
 * This pattern is used by UserSelector, HealthcareServiceSelector, and other similar components.
 *
 * Key behavior:
 * - Single selection (auto-closes after select)
 * - Uses CommandInput with data-slot="command-input" for search
 * - Options are directly clickable CommandItems
 * - Works with both Popover (desktop) and Drawer (mobile)
 *
 * @example
 * await selectFromCommand(page, trigger, {
 *   search: "Search Term",
 *   itemIndex: 0
 * });
 */
export async function selectFromCommand(
  page: Page,
  trigger: Locator,
  { search, itemIndex = 0 }: SelectFromCommandOptions = {},
) {
  await trigger.waitFor({ state: "visible" });
  await trigger.scrollIntoViewIfNeeded();

  // Close any existing popovers before opening
  await closeAnyOpenPopovers(page);

  await trigger.click();

  // Wait for the picker to open (could be dialog or popover)
  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;

  await scope.waitFor({ state: "visible" });

  // If search is provided, use the search input
  if (search) {
    // Try finding by data-slot first (standard CommandInput), fallback to placeholder
    const input = scope.locator('[data-slot="command-input"]').first();
    const isInputVisible = await input.isVisible().catch(() => false);

    if (isInputVisible) {
      await input.fill("");
      await input.fill(search);
      // Wait for search results to update
      await page.waitForTimeout(500);
    } else {
      // Fallback for custom inputs
      const placeholderInput = scope.getByPlaceholder(/search/i).first();
      if (await placeholderInput.isVisible().catch(() => false)) {
        await placeholderInput.fill("");
        await placeholderInput.fill(search);
        await page.waitForTimeout(500);
      }
    }
  }

  // Wait for options to load
  const options = scope.getByRole("option");
  await options.first().waitFor({ state: "visible" });

  const count = await options.count();
  if (count === 0) {
    throw new Error("No options found in command selector");
  }

  // Click the option directly
  const targetOption = options.nth(itemIndex);
  await targetOption.click();

  // Auto-closes on selection, so wait for it to close
  await scope.waitFor({ state: "hidden" }).catch(() => {});
}

interface SelectFromCategoryPickerOptions {
  search?: string;
  navigateCategories?: string[];
  itemIndex?: number;
  closeAfterSelect?: boolean;
}

/**
 * Helper for ResourceDefinitionCategoryPicker with hierarchical category navigation
 * This picker allows navigating through categories (folders) before selecting items
 *
 * @example
 * // Navigate by category names
 * await selectFromCategoryPicker(page, trigger, {
 *   navigateCategories: ["Lab Tests", "Blood Tests"],
 *   itemIndex: 0
 * });
 *
 * @example
 * // Search for an item directly (bypasses category navigation)
 * await selectFromCategoryPicker(page, trigger, {
 *   search: "Complete Blood Count",
 *   itemIndex: 0
 * });
 *
 * @example
 * // Auto-navigate if first item is a folder
 * await selectFromCategoryPicker(page, trigger, {
 *   itemIndex: 0  // If item at index 0 is a folder, it will auto-navigate into it
 * });
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
  await trigger.scrollIntoViewIfNeeded();

  // Close any existing popovers before opening
  await closeAnyOpenPopovers(page);

  await trigger.click();

  // Wait for the picker to open (could be dialog or popover)
  const dialog = page.getByRole("dialog").last();
  const hasDialog = await dialog.isVisible().catch(() => false);
  const popper = page.locator("[data-radix-popper-content-wrapper]").last();
  const scope = hasDialog ? dialog : popper;

  await scope.waitFor({ state: "visible" });

  // Navigate through categories if specified
  for (const categoryTitle of navigateCategories) {
    // Wait for the category to appear
    const categoryItem = scope.getByRole("option", {
      name: new RegExp(categoryTitle, "i"),
    });
    await categoryItem.waitFor({ state: "attached" });
    await categoryItem.waitFor({ state: "visible" });
    await categoryItem.click();
  }

  // If search is provided, use search to filter items
  // This bypasses category navigation and searches across all items
  if (search) {
    const input = scope.locator('[data-slot="command-input"]').first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill("");
      await input.fill(search);
    }
  }

  // Wait for items to load
  const items = scope.getByRole("option");
  await items.first().waitFor({ state: "attached" });
  await items.first().waitFor({ state: "visible" });

  const count = await items.count();
  if (count === 0) {
    throw new Error("No items found in category picker");
  }

  // Select item at itemIndex
  let targetItem = items.nth(itemIndex);
  await targetItem.waitFor({ state: "attached" });
  await targetItem.waitFor({ state: "visible" });

  // Check if the item has a chevron (indicates it's a folder/category)
  const hasChevron = await targetItem
    .locator("svg.lucide-chevron-right")
    .isVisible()
    .catch(() => false);

  if (hasChevron && navigateCategories.length === 0 && !search) {
    // If no categories specified and no search, but we found a folder, click into it first
    await targetItem.click();

    // Now select the item at itemIndex in this category
    const newItems = scope.getByRole("option");
    await newItems.first().waitFor({ state: "attached" });
    await newItems.first().waitFor({ state: "visible" });
    targetItem = newItems.nth(itemIndex);
    await targetItem.waitFor({ state: "attached" });
    await targetItem.waitFor({ state: "visible" });
  }

  // Ensure the item is stable and clickable
  await targetItem.scrollIntoViewIfNeeded();
  await targetItem.click();

  if (closeAfterSelect) {
    await page.keyboard.press("Escape");
    await scope.waitFor({ state: "hidden" }).catch(() => {});
  }
}

/**
 * Checks if a toast notification with the given text is visible
 * @param page - Playwright page object
 * @param text - Text to search for in the toast (can be string or RegExp)
 * @param options - Additional options for the toast check
 */
export async function expectToast(
  page: Page,
  text: string | RegExp,
  options: { timeout?: number } = {},
) {
  const toaster = page.locator(".toaster.group");
  await expect(toaster.getByText(text)).toBeVisible(options);
}

/**
 * Gets a card element by its title
 * @param page - Playwright page object
 * @param title - Card title to search for (can be string or RegExp)
 * @returns Locator for the card element
 */
export function getCardByTitle(page: Page, title: string | RegExp) {
  return page.locator('[data-slot="card"]').filter({
    has: page.locator('[data-slot="card-title"]', { hasText: title }),
  });
}

export async function clearFilter(page: Page) {
  const clearButton = page
    .getByRole("button")
    .filter({ has: page.locator("svg.lucide-x") })
    .first();
  await clearButton.click();
}

/**
 * Helper to select a value from a FilterSelect component
 * FilterSelect uses a Select component with a combobox trigger that shows the label
 *
 * @param page - Playwright page object
 * @param label - The label text of the FilterSelect (e.g., "status", "category")
 * @param value - The value to select (will be matched case-insensitively)
 *
 * @example
 * await selectFromFilterSelect(page, "status", "active");
 * await selectFromFilterSelect(page, "category", "laboratory");
 */
export async function selectFromFilterSelect(
  page: Page,
  label: string | RegExp,
  value: string,
) {
  // Find the FilterSelect combobox by its label text
  const filterSelect = page
    .getByRole("combobox")
    .filter({ hasText: label })
    .first();
  await filterSelect.waitFor({ state: "visible" });
  await filterSelect.scrollIntoViewIfNeeded();
  await filterSelect.click();

  // Select the option by value (case-insensitive match)
  const option = page.getByRole("option", {
    name: new RegExp(value, "i"),
  });
  await option.waitFor({ state: "visible" });
  await option.click();
}

/**
 * Apply a filter to a table view with navigation and filter selection
 * @param page - Playwright page object
 * @param url - Full URL to navigate to
 * @param filterLabel - Filter label regex (e.g., /status/i, /category/i)
 * @param filterValue - Value to filter by
 *
 * @example
 * await applyTableFilter(page, "/facility/123/settings/definitions", /status/i, "Active");
 */
export async function applyTableFilter(
  page: Page,
  url: string,
  filterLabel: RegExp,
  filterValue: string,
) {
  await page.goto(url);
  await clearFilter(page);
  await page.locator('[data-slot="table-body"]').waitFor({ state: "visible" });

  await selectFromFilterSelect(page, filterLabel, filterValue);
  await page.waitForLoadState("networkidle");

  const tableBody = page.locator('[data-slot="table-body"]');
  await tableBody.waitFor({ state: "visible" });

  const tableBodyRows = tableBody.locator('[data-slot="table-row"]');
  await tableBodyRows.first().waitFor({ state: "visible" });
}

/**
 * Verify all badges in table match expected text and optionally verify specific row exists
 * @param page - Playwright page object
 * @param badgeText - Expected badge text to verify
 * @param specificRowText - Optional text to find specific row
 *
 * @example
 * await verifyTableBadges(page, "Active", "My Activity");
 * await verifyTableBadges(page, "Laboratory"); // Without specific row check
 */
export async function verifyTableBadges(
  page: Page,
  badgeText: string,
  specificRowText?: string,
) {
  const tableBody = page.locator('[data-slot="table-body"]');
  const tableBodyRows = tableBody.locator('[data-slot="table-row"]');
  const rowCount = await tableBodyRows.count();

  if (rowCount > 0) {
    const badges = tableBody
      .locator('[data-slot="badge"]')
      .filter({ hasText: badgeText });
    await expect(badges).toHaveCount(rowCount);
  }

  if (specificRowText) {
    const specificRow = page.locator('[data-slot="table-row"]', {
      hasText: specificRowText,
    });
    await expect(specificRow).toBeVisible();
  }
}
