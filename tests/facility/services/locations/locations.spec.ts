import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { createHealthcareService, toggleSidebar } from "../helpers";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Locations", () => {
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

  test("should switch location (collapsed sidebar)", async ({ page }) => {
    await page.getByRole("link", { name: serviceName }).click();
    await expect(
      page.getByRole("heading").getByText(serviceName),
    ).toBeVisible();
    await page.getByRole("link", { name: "Pharmacy" }).click();
    await expect(
      page.getByRole("heading").getByText("Prescription Queue"),
    ).toBeVisible();
    await toggleSidebar(page, true);
    await page.getByRole("button", { name: "Pharmacy" }).click();
    await expect(page.getByText("Current Location:Pharmacy")).toBeVisible();
    await page.getByPlaceholder("Search").fill("Bio-Chemistry Lab");
    await page.getByRole("option", { name: "Bio-Chemistry Lab" }).click();
    await expect(
      page.getByRole("button", { name: "Bio-Chemistry Lab" }),
    ).toBeVisible();
  });

  test("should switch location (expanded sidebar)", async ({ page }) => {
    await page.getByRole("link", { name: serviceName }).click();
    await expect(
      page.getByRole("heading").getByText(serviceName),
    ).toBeVisible();
    await page.getByRole("link", { name: "Pharmacy" }).click();
    await expect(
      page.getByRole("heading").getByText("Prescription Queue"),
    ).toBeVisible();
    await toggleSidebar(page, false);
    await page
      .getByRole("button")
      .filter({ hasText: /Current Location/ })
      .click();
    await expect(page.getByText("Current LocationPharmacy")).toBeVisible();
    await page.getByPlaceholder("Search").fill("Bio-Chemistry Lab");
    await page.getByRole("option", { name: "Bio-Chemistry Lab" }).click();
    await expect(
      page
        .getByRole("button")
        .filter({ hasText: "Current LocationBio-Chemistry" }),
    ).toBeVisible();
  });
});
