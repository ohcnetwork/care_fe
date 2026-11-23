import { expect, type Locator, type Page } from "@playwright/test";

type Scope = Page | Locator;

export const departmentTrigger = (scope: Scope) =>
  scope.getByRole("button", { name: "Select Department" });

// Selected departments render as cards below the trigger.
export const departmentCards = (scope: Scope) =>
  scope.locator('[data-slot="tree-select-card"]');

const searchBox = (page: Page) =>
  page.getByRole("combobox", { name: "Search departments" });

const doneButton = (page: Page) =>
  page.getByRole("button", { name: /^Done\b/ });

/**
 * Picks a department by name. A multi-select keeps its panel open, so it is
 * closed with Done; a single-select closes itself.
 */
export async function selectDepartment(
  page: Page,
  scope: Scope,
  name: string,
  { multiple = false }: { multiple?: boolean } = {},
) {
  await departmentTrigger(scope).click();
  await searchBox(page).fill(name);
  // Searching hides "My departments", so only one row matches.
  const control = page
    .getByRole(multiple ? "checkbox" : "radio", { name, exact: true })
    .first();
  if (multiple) {
    if (!(await control.isChecked())) await control.click();
    await doneButton(page).click();
  } else {
    await control.click();
  }
  await expect(searchBox(page)).toBeHidden();
}

/** Picks the first department that is neither selected nor already linked. */
export async function selectFirstAvailableDepartment(page: Page, scope: Scope) {
  await departmentTrigger(scope).click();
  await page
    .getByRole("tree")
    .getByRole("checkbox", { checked: false, disabled: false })
    .first()
    .click();
  await doneButton(page).click();
  await expect(searchBox(page)).toBeHidden();
}
