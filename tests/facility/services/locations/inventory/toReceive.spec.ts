import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

let orderName: string;
let bioChemLabLocationId: string;
let bioChembasePath: string;
let isInitialized: boolean = false;

test.describe("Facility To-Receive Orders Inventory Flow", () => {
  async function setupInitialData(page: Page) {
    if (isInitialized) return;
    const facilityId = getFacilityId();
    const servicesUrl = `/facility/${facilityId}/services/`;
    await page.goto(servicesUrl);

    await page.getByRole("link", { name: "Main Pharmacy" }).click();
    await page.getByRole("link", { name: "Pharmacy" }).click();
    await page.goto(servicesUrl);
    await page.getByRole("link", { name: "Pathology Lab" }).click();
    await page.getByRole("link", { name: "Bio-Chemistry" }).click();
    bioChemLabLocationId =
      page
        .url()
        .match(
          new RegExp(
            `/facility/${facilityId}/locations/([^/]+)/service_requests`,
          ),
        )?.[1] ?? "";
    bioChembasePath = `/facility/${facilityId}/locations/${bioChemLabLocationId}`;
    isInitialized = true;
  }

  test.beforeEach(async ({ page }) => {
    await setupInitialData(page);
    // Navigate to the To-Receive Orders Inventory page before each test
    await page.goto(bioChembasePath + "/inventory/internal/receive");
  });

  test("raise new stock request and mark as approved", async ({ page }) => {
    orderName = faker.lorem.words(5);
    await page.getByRole("button", { name: "Raise Stock Request" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(orderName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Location" })
      .click();
    await page.getByRole("option", { name: "Pharmacy" }).click();
    await page.getByRole("radio", { name: "Urgent" }).check();
    await page.getByRole("button", { name: "Create" }).click();
    const heading = page.getByRole("heading", { name: orderName });
    await expect(heading).toBeVisible();
    await page.getByRole("combobox").filter({ hasText: "Add Item" }).click();
    await page.getByRole("option", { name: "Medication" }).click();
    await page.getByRole("option", { name: "Paracetamol" }).click();
    await page.getByRole("spinbutton").fill("5");
    await page.getByRole("button", { name: "Save List" }).click();
    let tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText("Paracetamol");
    await expect(tableRow1).toContainText("5");
    await page.getByRole("button", { name: "Mark as Approved" }).click();
    await page.goto(bioChembasePath + "/inventory/internal/receive");
    // verify item in table row 1
    tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText(orderName);
    await expect(tableRow1).toContainText("Pharmacy");
  });

  test("mark stock request as completed", async ({ page }) => {
    orderName = faker.lorem.words(5);
    await page.getByRole("button", { name: "Raise Stock Request" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(orderName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Location" })
      .click();
    await page.getByRole("option", { name: "Pharmacy" }).click();
    await page.getByRole("radio", { name: "Urgent" }).check();
    await page.getByRole("button", { name: "Create" }).click();
    const heading = page.getByRole("heading", { name: orderName });
    await expect(heading).toBeVisible();
    await page.getByRole("combobox").filter({ hasText: "Add Item" }).click();
    await page.getByRole("option", { name: "Medication" }).click();
    await page.getByRole("option", { name: "Paracetamol" }).click();
    await page.getByRole("spinbutton").fill("5");
    await page.getByRole("button", { name: "Save List" }).click();
    let tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText("Paracetamol");
    await expect(tableRow1).toContainText("5");
    await page
      .getByRole("button", { name: "Mark as Approved" })
      .click({ timeout: 5000 });
    await page
      .locator('[data-slot="dropdown-menu-trigger"]:has(.care-l-ellipsis-v)')
      .click();
    await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
    await page.goto(bioChembasePath + "/inventory/internal/receive");
    await page.getByRole("tab", { name: "Completed" }).click();
    // verify item in table row 1
    tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText(orderName);
    await expect(tableRow1).toContainText("Pharmacy");
  });
});
