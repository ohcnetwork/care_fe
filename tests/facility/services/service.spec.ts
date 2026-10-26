import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { createHealthcareService, toggleSidebar } from "./helpers";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Services", () => {
  let facilityId: string;
  let serviceName: string;
  let servicesUrl: string;

  async function createService(page: Page, serviceName: string) {
    await createHealthcareService(page, facilityId, serviceName, servicesUrl);
  }

  test.beforeAll(async ({ browser }) => {
    facilityId = getFacilityId();
    serviceName =
      faker.string.uuid().slice(0, 5) + faker.commerce.productName();
    servicesUrl = `/facility/${facilityId}/services/`;
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    await createService(page, serviceName);
    await page.close();
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(servicesUrl);
  });

  test("should switch healthcare service (expanded sidebar)", async ({
    page,
  }) => {
    await page.getByRole("link", { name: serviceName }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: serviceName, exact: true }),
    ).toBeVisible();
    await toggleSidebar(page, true);
    await page.getByRole("button", { name: serviceName }).click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: serviceName, exact: true }),
    ).toBeVisible();
    await dialog.getByPlaceholder("Search").fill("Pathology Lab");
    await dialog.getByRole("option", { name: "Pathology Lab" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Pathology Lab",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("should switch healthcare service (collapsed sidebar)", async ({
    page,
  }) => {
    await page.getByRole("link", { name: serviceName }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: serviceName, exact: true }),
    ).toBeVisible();
    await toggleSidebar(page, false);
    const toggle = page
      .getByRole("button", {
        name: "Toggle Sidebar",
        exact: true,
        includeHidden: true,
      })
      .and(page.locator('[data-sidebar="trigger"]:visible'));
    await page.mouse.move(900, 700);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.hover();
    await page
      .getByRole("button", { name: serviceName, exact: true })
      .and(page.locator('[aria-haspopup="dialog"]'))
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: serviceName, exact: true }),
    ).toBeVisible();
    await dialog.getByPlaceholder("Search").fill("Pathology Lab");
    await dialog.getByRole("option", { name: "Pathology Lab" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Pathology Lab",
        exact: true,
      }),
    ).toBeVisible();
  });
});
