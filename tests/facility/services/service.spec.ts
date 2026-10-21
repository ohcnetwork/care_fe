import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
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

test.describe("Services list search", () => {
  // Share one worker so the seeded services are created only once
  test.describe.configure({ mode: "default" });

  const PAGE_SIZE = 12;
  let facilityId: string;
  let servicesUrl: string;
  let serviceNames: string[];

  const searchInput = (page: Page) =>
    page.getByRole("textbox", { name: "Search healthcare services..." });

  const serviceCards = (page: Page) =>
    page
      .getByRole("main")
      .locator(`a[href^="/facility/${facilityId}/services/"]`);

  test.beforeAll(async ({ playwright }) => {
    facilityId = getFacilityId();
    servicesUrl = `/facility/${facilityId}/services`;
    const prefix = `Search ${faker.string.alphanumeric(8)}`;
    // One more than a page so the unfiltered list always paginates
    serviceNames = Array.from(
      { length: PAGE_SIZE + 1 },
      (_, i) => `${prefix} ${String(i).padStart(2, "0")}`,
    );

    const request = await playwright.request.newContext();
    const headers = getApiHeaders();
    await Promise.all(
      serviceNames.map(async (name) => {
        const response = await request.post(
          `${getApiUrl()}/api/v1/facility/${facilityId}/healthcare_service/`,
          {
            headers,
            data: {
              name,
              extra_details: "",
              styling_metadata: {},
              locations: [],
              managing_organization: null,
            },
          },
        );
        expect(response.ok(), await response.text()).toBeTruthy();
      }),
    );
    await request.dispose();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(servicesUrl);
    await expect(serviceCards(page)).toHaveCount(PAGE_SIZE);
  });

  test("should show only services matching the search", async ({ page }) => {
    const target = serviceNames[3];
    await searchInput(page).fill(target);

    await expect(page).toHaveURL(/[?&]search=/);
    await expect(serviceCards(page)).toHaveCount(1);
    await expect(serviceCards(page)).toContainText(target);
  });

  test("should show empty state when no service matches", async ({ page }) => {
    await searchInput(page).fill(`nomatch-${faker.string.alphanumeric(12)}`);

    await expect(page.getByText("No services found")).toBeVisible();
    await expect(serviceCards(page)).toHaveCount(0);
  });

  test("should restore the full list when the search is cleared", async ({
    page,
  }) => {
    await searchInput(page).fill(serviceNames[0]);
    await expect(serviceCards(page)).toHaveCount(1);

    await searchInput(page).fill("");

    await expect(page).not.toHaveURL(/[?&]search=/);
    await expect(serviceCards(page)).toHaveCount(PAGE_SIZE);
    await expect(page.locator("#page-2")).toBeVisible();
  });

  test("should reset to the first page when searching from a later page", async ({
    page,
  }) => {
    await page.locator("#page-2").click();
    await expect(page).toHaveURL(/[?&]page=2(&|$)/);

    const target = serviceNames[5];
    await searchInput(page).fill(target);

    await expect(page).toHaveURL(/[?&]page=1(&|$)/);
    await expect(serviceCards(page)).toHaveCount(1);
    await expect(serviceCards(page)).toContainText(target);
  });
});
