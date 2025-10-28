import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

let orderName: string;
let bioChemLabLocationId: string;
let pharmacyLocationId: string;
let bioChembasePath: string;
let pharmacybasePath: string;

test.describe("Facility To-Receive Orders Inventory Flow", () => {
  test.beforeAll(async ({ page }) => {
    const facilityId = getFacilityId();
    const servicesUrl = `/facility/${facilityId}/services/`;
    await page.goto(servicesUrl);
    let viewDetailsBtn = page
      .locator("div")
      .filter({ hasText: /^Main PharmacyView Details$/ })
      .nth(1)
      .locator("button", { hasText: "View Details" });
    await viewDetailsBtn.click();
    await page.getByRole("button", { name: "View Prescriptions" }).click();
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
    viewDetailsBtn = page
      .locator("div")
      .filter({ hasText: /^Pathology LabView Details$/ })
      .nth(1)
      .locator("button", { hasText: "View Details" });
    await viewDetailsBtn.click();
    await page.getByRole("button", { name: "View Requests" }).click();
    bioChemLabLocationId =
      page
        .url()
        .match(
          new RegExp(
            `/facility/${facilityId}/locations/([^/]+)/service_requests`,
          ),
        )?.[1] ?? "";
    bioChembasePath = `/facility/${facilityId}/locations/${bioChemLabLocationId}`;
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the To-Receive Orders Inventory page before each test
    await page.goto(bioChembasePath + "/inventory/internal/receive");
  });

  test("raise new stock request", async ({ page }) => {
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
    await page.goto(bioChembasePath);
    // verify item in table row 1
    tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText(orderName);
    await expect(tableRow1).toContainText("Pharmacy");
  });

  test("approve stock request", async ({ page }) => {
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
    await page.locator('[id="radix-«r1t»"]').click();
    await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
    await page.goto(bioChembasePath);
    await page.getByRole("tab", { name: "Completed" }).click();
    // verify item in table row 1
    tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText(orderName);
    await expect(tableRow1).toContainText("Pharmacy");
  });

  test("switch location and create delivery order", async ({ page }) => {
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
    await page.goto(bioChembasePath);
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    const row1 = page.locator("table tbody tr").nth(0);
    await expect(row1).toContainText(orderName);
    await row1.getByRole("button", { name: "See Details" }).click();
    tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText("Paracetamol");
    await expect(tableRow1).toContainText("5");
    await page.getByRole("link", { name: "Create Delivery Order" }).click();
    await page.getByRole("button", { name: "Create" }).click();
    await page.getByRole("button", { name: "Load from order" }).click();
    await page.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: "Select stock" }).nth(1).click();
    await page.locator("div").filter({ hasText: "₹20" }).nth(3).click();
    await page.getByRole("button", { name: "Add Items" }).click();
    await page.getByRole("button", { name: "Mark as Approved" }).click();
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
    const deliveryRow1 = page.locator("table tbody tr").nth(0);
    await expect(deliveryRow1).toContainText(orderName);
  });

  test("approve incoming delivery order", async ({ page }) => {
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
    await page.goto(bioChembasePath);
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    const row1 = page.locator("table tbody tr").nth(0);
    await expect(row1).toContainText(orderName);
    await row1.getByRole("button", { name: "See Details" }).click();
    tableRow1 = page.locator("table tbody tr").nth(0);
    await expect(tableRow1).toContainText("Paracetamol");
    await expect(tableRow1).toContainText("5");
    await page.getByRole("link", { name: "Create Delivery Order" }).click();
    await page.getByRole("button", { name: "Create" }).click();
    await page.getByRole("button", { name: "Load from order" }).click();
    await page.getByRole("button", { name: "Done" }).click();
    await page.getByRole("button", { name: "Select stock" }).nth(1).click();
    await page.locator("div").filter({ hasText: "₹20" }).nth(3).click();
    await page.getByRole("button", { name: "Add Items" }).click();
    await page.getByRole("button", { name: "Mark as Approved" }).click();
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
    const deliveryRow1 = page.locator("table tbody tr").nth(0);
    await expect(deliveryRow1).toContainText(orderName);

    await page.goto(bioChembasePath + "/inventory/internal/receive");
    await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
    const incomingDeliveryRow1 = page.locator("table tbody tr").nth(0);
    await expect(incomingDeliveryRow1).toContainText(orderName);
    await incomingDeliveryRow1
      .getByRole("button", { name: "View Details" })
      .click();
    await page
      .getByRole("row", { name: "Item Requested Qty. Received" })
      .getByRole("checkbox")
      .click();
    await page.getByRole("button", { name: "Mark as Completed" }).click();

    await page.goto(bioChembasePath + "/inventory/internal/receive");
    await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
    await page.getByRole("tab", { name: "Completed" }).click();
    const completedDeliveryRow1 = page.locator("table tbody tr").nth(0);
    await expect(completedDeliveryRow1).toContainText(orderName);
  });
});
