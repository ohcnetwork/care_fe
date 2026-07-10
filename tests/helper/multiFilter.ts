import { expect, type Locator, type Page } from "@playwright/test";

export function selectedMultiFilterBar(page: Page, label: RegExp) {
  return page
    .locator('[data-slot="dropdown-menu-trigger"]')
    .filter({ hasText: label })
    .locator("xpath=..");
}

export async function clearSelectedMultiFilter(page: Page, label: RegExp) {
  await selectedMultiFilterBar(page, label)
    .locator('[data-slot="button"]')
    .click();
}

export async function clearAllMultiFilters(page: Page) {
  await page.getByRole("button", { name: /clear all/i }).click();
}

export async function openMultiFilter(
  page: Page,
  filterName: RegExp,
  scope: Page | Locator = page,
) {
  await scope.getByRole("button", { name: /^filter$/i }).click();
  await page.getByRole("menuitem", { name: filterName }).click();
}

export async function applyDateFilterPreset(
  page: Page,
  filterName: RegExp,
  presetName: RegExp,
) {
  await openMultiFilter(page, filterName);
  await page.getByRole("menuitem", { name: presetName }).click();
}

export async function applyCustomDateFilterRange(
  page: Page,
  filterName: RegExp,
  after: string,
  before: string,
) {
  await openMultiFilter(page, filterName);
  await page.getByRole("menuitem", { name: /custom date range/i }).click();

  const dateInputs = page.locator('input[type="date"]');
  await dateInputs.first().fill(after);
  await dateInputs.nth(1).fill(before);
  await page.getByRole("button", { name: /confirm/i }).click();
}

export async function applyFacilityUserMineFilter(
  page: Page,
  filterName: RegExp,
) {
  await openMultiFilter(page, filterName);
  await page.getByRole("menuitem", { name: /mine/i }).click();
  await page.keyboard.press("Escape");
  await expect(selectedMultiFilterBar(page, filterName)).toBeVisible();
}
