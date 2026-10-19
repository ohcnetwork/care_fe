import { expect, Page } from "@playwright/test";

export async function createHealthcareService(
  page: Page,
  facilityId: string,
  serviceName: string,
  servicesUrl: string,
) {
  await page.goto(`/facility/${facilityId}/settings/healthcare_services`);
  await page.getByRole("button", { name: "Add Healthcare Service" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(serviceName);
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select Internal Type" })
    .click();
  await page.getByRole("option", { name: "Pharmacy" }).click();
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select locations" })
    .click();
  await page.getByPlaceholder("Search locations...").fill("Pharmacy");
  await page
    .getByRole("dialog")
    .getByRole("button")
    .filter({ hasText: /^$/ })
    .click();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(serviceName)).toBeVisible();
  await page.goto(servicesUrl);
}

export async function toggleSidebar(page: Page, expand: boolean) {
  const homeButtonVisible = await page
    .getByRole("button", { name: "Home" })
    .isVisible();
  if ((expand && !homeButtonVisible) || (!expand && homeButtonVisible)) {
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  }
}
