import { expect, type Locator, type Page } from "@playwright/test";

export function selectedMultiFilterBar(page: Page, label: RegExp) {
  return page.getByRole("group", { name: label });
}

export async function clearSelectedMultiFilter(page: Page, label: RegExp) {
  await page.keyboard.press("Escape");
  await selectedMultiFilterBar(page, label)
    .getByRole("button", { name: "Remove filter", exact: true })
    .click();
}

export async function clearAllMultiFilters(page: Page) {
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^clear all$/i }).click();
}

export async function openMultiFilter(
  page: Page,
  filterName: RegExp,
  scope: Page | Locator = page,
) {
  await scope.getByRole("button", { name: /^filter$/i }).click();
  await page.getByRole("option", { name: filterName }).click();
}

/** Picks one option of a list filter (status, type, method) and closes it. */
export async function applyOptionFilter(
  page: Page,
  filterName: RegExp,
  optionName: RegExp,
) {
  await openMultiFilter(page, filterName);
  await page.getByRole("option", { name: optionName }).click();
  await page.keyboard.press("Escape");
}

export async function applyDateFilterPreset(
  page: Page,
  filterName: RegExp,
  presetName: RegExp,
) {
  await openMultiFilter(page, filterName);
  await page.getByRole("menuitem", { name: presetName }).click();
  await page.keyboard.press("Escape");
}

export async function applyCustomDateFilterRange(
  page: Page,
  filterName: RegExp,
  after: string,
  before: string,
) {
  await openMultiFilter(page, filterName);
  await page.getByRole("menuitem", { name: /custom date range/i }).click();

  const dateInputs = page.locator('[data-slot="date-range-picker"] input');
  const localFormat = (date: string) => date.split("-").reverse().join("/");
  await dateInputs.first().fill(localFormat(after));
  await dateInputs.nth(1).fill(localFormat(before));
  await page.getByRole("button", { name: /^apply$/i }).click();
  await page.keyboard.press("Escape");
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
