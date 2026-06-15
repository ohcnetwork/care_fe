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
    const page = await browser.newPage();
    await createService(page, serviceName);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(servicesUrl);
  });

  test("should switch healthcare service (expanded sidebar)", async ({
    page,
  }) => {
    await page.getByRole("link", { name: serviceName }).click();
    await expect(
      page.getByRole("heading").getByText(serviceName),
    ).toBeVisible();
    await toggleSidebar(page, true);
    await page.getByRole("button", { name: serviceName }).click();
    await expect(
      page.getByRole("heading").getByText(serviceName),
    ).toBeVisible();
    await page.getByPlaceholder("Search").fill("Pathology Lab");
    await page.getByRole("option", { name: "Pathology Lab" }).click();
    await expect(
      page.getByRole("heading").getByText("Pathology Lab"),
    ).toBeVisible();
  });

  test("should switch healthcare service (collapsed sidebar)", async ({
    page,
  }) => {
    await page.getByRole("link", { name: serviceName }).click();
    await expect(
      page.getByRole("heading").getByText(serviceName),
    ).toBeVisible();
    await toggleSidebar(page, false);
    await page
      .getByRole("button")
      .filter({ hasText: /Current Service/ })
      .click();
    await expect(
      page.getByRole("heading").getByText(serviceName),
    ).toBeVisible();
    await page.getByPlaceholder("Search").fill("Pathology Lab");
    await page.getByRole("option", { name: "Pathology Lab" }).click();
    await expect(
      page.getByRole("heading").getByText("Pathology Lab"),
    ).toBeVisible();
  });
});
