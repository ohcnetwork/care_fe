import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

let orderName: string;
let bioChemLabLocationId: string;
let pharmacyLocationId: string;
let bioChembasePath: string;
let pharmacybasePath: string;
let isInitialized: boolean = false;

test.describe("Facility To-Dispatch Orders Inventory Flow", () => {
  async function addRequestedStock(page: Page) {
    await page.getByRole("button", { name: /^Load from order\b/ }).click();
    const requestPicker = page.getByRole("dialog", {
      name: "Select Items to Add",
      exact: true,
    });
    await requestPicker
      .getByRole("checkbox", { name: "Select All", exact: true })
      .uncheck();
    await requestPicker.getByRole("checkbox", { name: /Paracetamol/ }).check();
    await requestPicker.getByRole("button", { name: /^Done\b/ }).click();
    await expect(requestPicker).not.toBeVisible();
    const form = page.getByRole("form", {
      name: "Pending changes",
      exact: true,
    });
    await expect(form.getByRole("spinbutton")).toHaveValue(/^5(?:\.0+)?$/);
    await form
      .getByRole("button", { name: /^Select stock$/i })
      .last()
      .click();
    await page
      .getByRole("dialog")
      .getByRole("checkbox", { disabled: false })
      .first()
      .check();
    await page.keyboard.press("Escape");
    await form.getByRole("button", { name: /^Save Changes\b/ }).click();
    await expect(form).not.toBeVisible();
  }

  async function createStockRequest(page: Page, orderNameParam?: string) {
    await page.goto(bioChembasePath + "/inventory/internal/receive");
    orderName = orderNameParam ?? faker.lorem.words(5);
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

    await page.goto(bioChembasePath + "/inventory/internal/receive");
    // verify item appears in table
    const orderRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(orderRow.first()).toBeVisible();
    await expect(orderRow.first()).toContainText("Pharmacy");
    await page.goto(bioChembasePath + "/inventory/internal/receive");
  }

  async function setupInitialData(page: Page) {
    if (isInitialized) return;
    const facilityId = getFacilityId();
    const servicesUrl = `/facility/${facilityId}/services/`;
    await page.goto(servicesUrl);
    await page.getByRole("link", { name: "Main Pharmacy" }).click();
    await page.getByRole("link", { name: "Pharmacy" }).click();
    pharmacyLocationId =
      page
        .url()
        .match(
          new RegExp(
            `/facility/${facilityId}/locations/([^/]+)/medication_requests`,
          ),
        )?.[1] ?? "";
    pharmacybasePath = `/facility/${facilityId}/locations/${pharmacyLocationId}`;
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
    orderName = faker.lorem.words(5);
    await createStockRequest(page, orderName);
    isInitialized = true;
  }

  test.beforeEach(async ({ page }) => {
    await setupInitialData(page);
    // Navigate to the To-Receive Orders Inventory page before each test
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
  });

  test("switch location and create delivery order", async ({ page }) => {
    const orderRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(orderRow.first()).toBeVisible();
    await orderRow.first().getByRole("button", { name: "See Details" }).click();
    let tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText("Paracetamol");
    await expect(tableRow1).toContainText("5");
    await page.getByRole("link", { name: "Create Delivery Order" }).click();
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByRole("button", { name: "Load from order" }),
    ).toBeVisible();
    await addRequestedStock(page);
    await page.getByRole("button", { name: "Mark as Approved" }).click();
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
    const deliveryRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(deliveryRow.first()).toBeVisible();
  });

  test("approve incoming delivery order", async ({ page }) => {
    const orderRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(orderRow.first()).toBeVisible();
    await orderRow.first().getByRole("button", { name: "See Details" }).click();
    let tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText("Paracetamol");
    await expect(tableRow1).toContainText("5");
    await page.getByRole("link", { name: "Create Delivery Order" }).click();
    await page.getByRole("button", { name: "Create" }).click();
    await expect(
      page.getByRole("button", { name: "Load from order" }),
    ).toBeVisible();
    await addRequestedStock(page);
    await page.getByRole("button", { name: "Mark as Approved" }).click();
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
    const deliveryRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(deliveryRow.first()).toBeVisible();

    await page.goto(bioChembasePath + "/inventory/internal/receive");
    await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
    const incomingDeliveryRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(incomingDeliveryRow.first()).toBeVisible();
    await incomingDeliveryRow
      .first()
      .getByRole("button", { name: "View Details" })
      .click();
    await page
      .getByRole("row", { name: "Requested Qty." })
      .getByRole("checkbox")
      .check();
    const receiveButton = page.getByRole("button", {
      name: "Receive & Update Stock",
    });
    await expect(receiveButton).toBeEnabled();
    await receiveButton.click();
    await page.getByRole("button", { name: "Confirm" }).click();
    const markAsCompletedButton = page.getByRole("button", {
      name: "Mark as Completed",
    });
    await expect(markAsCompletedButton).toBeEnabled();
    await markAsCompletedButton.click();

    await page.goto(bioChembasePath + "/inventory/internal/receive");
    await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
    await page.getByRole("tab", { name: "Completed" }).click();
    const completedDeliveryRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(completedDeliveryRow.first()).toBeVisible();
  });
});
