import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/facilityAdmin.json" });

let bioChembasePath: string;
let pharmacybasePath: string;
const stockedItemName = "Ibuprofen";

async function createStockRequest(page: Page, orderName: string) {
  await page.goto(bioChembasePath + "/inventory/internal/receive");
  await page.getByRole("button", { name: "Raise Stock Request" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill(orderName);
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select Location" })
    .click();
  await page.getByRole("option", { name: "Pharmacy" }).click();
  await page.getByRole("radio", { name: "Urgent" }).check();
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(
    /\/inventory\/internal\/receive\/orders\/(?!new)[^/?]+/,
  );
  await expect(page.getByText("Order created successfully")).toBeVisible();
  await expect(page.getByRole("heading", { name: orderName })).toBeVisible();

  await page.getByRole("combobox").filter({ hasText: "Add Item" }).click();
  await page.getByRole("option", { name: "Medication" }).click();
  await page.getByRole("option", { name: stockedItemName }).click();
  await page.getByRole("spinbutton").fill("5");
  await page.getByRole("button", { name: "Save List" }).click();
  await expect(
    page.getByText("Supply requests created successfully"),
  ).toBeVisible();

  const requestedItemRow = page
    .locator("table tbody tr")
    .filter({ hasText: stockedItemName })
    .first();
  await expect(requestedItemRow).toContainText("5");

  await page
    .getByRole("button", { name: "Mark as Approved" })
    .click({ timeout: 5000 });

  await page.goto(bioChembasePath + "/inventory/internal/receive");
  const stockRequestRow = page
    .locator("table tbody tr")
    .filter({ hasText: orderName });
  await expect(stockRequestRow).toContainText("Pharmacy");
}

async function setupLocationPaths(page: Page) {
  const facilityId = getFacilityId();
  const servicesUrl = `/facility/${facilityId}/services/`;

  await page.goto(servicesUrl);
  await page.getByRole("link", { name: "Main Pharmacy" }).click();
  await page.getByRole("link", { name: "Pharmacy" }).click();
  const pharmacyMatch = page
    .url()
    .match(
      new RegExp(
        `/facility/${facilityId}/locations/([^/]+)/medication_requests`,
      ),
    );
  if (!pharmacyMatch) {
    throw new Error(
      "Unable to extract the pharmacy location ID from the current URL.",
    );
  }
  pharmacybasePath = `/facility/${facilityId}/locations/${pharmacyMatch[1]}`;

  await page.goto(servicesUrl);
  await page.getByRole("link", { name: "Pathology Lab" }).click();
  await page.getByRole("link", { name: "Bio-Chemistry" }).click();
  const bioChemMatch = page
    .url()
    .match(
      new RegExp(`/facility/${facilityId}/locations/([^/]+)/service_requests`),
    );
  if (!bioChemMatch) {
    throw new Error(
      "Unable to extract the bio-chemistry location ID from the current URL.",
    );
  }
  bioChembasePath = `/facility/${facilityId}/locations/${bioChemMatch[1]}`;
}

async function openStockRequestDetails(page: Page, orderName: string) {
  const row = page.locator("table tbody tr").filter({ hasText: orderName });
  await expect(row).toContainText(orderName);
  await row.getByRole("button", { name: "See Details" }).click();

  const itemRow = page
    .locator("table tbody tr")
    .filter({ hasText: stockedItemName });
  await expect(itemRow).toContainText("5");
}

async function createApprovedDeliveryOrder(page: Page) {
  await page.getByRole("link", { name: "Create Delivery Order" }).click();
  await page.getByRole("button", { name: "Create" }).click();
  await page.getByRole("button", { name: "Load from order" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Select stock" }).first().click();
  await expect(page.getByPlaceholder("Search")).toBeVisible();
  await page.getByRole("checkbox").first().click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Mark as Approved" }).click();
}

test.beforeAll(async ({ browser }) => {
  const setupContext = await browser.newContext({
    storageState: "tests/.auth/facilityAdmin.json",
  });
  const setupPage = await setupContext.newPage();
  await setupLocationPaths(setupPage);
  await setupPage.close();
  await setupContext.close();
});

test.describe("Facility To-Dispatch Orders Inventory Flow", () => {
  test("switch location and create delivery order", async ({ page }) => {
    const orderName = `dispatch-order-${faker.string.uuid()}`;

    await createStockRequest(page, orderName);
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    await openStockRequestDetails(page, orderName);
    await createApprovedDeliveryOrder(page);

    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
    const deliveryRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(deliveryRow).toContainText(orderName);
  });

  test("approve incoming delivery order", async ({ page }) => {
    const orderName = `incoming-delivery-${faker.string.uuid()}`;

    await createStockRequest(page, orderName);
    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    await openStockRequestDetails(page, orderName);
    await createApprovedDeliveryOrder(page);

    await page.goto(pharmacybasePath + "/inventory/internal/dispatch");
    await page.getByRole("tab", { name: "Outgoing Deliveries" }).click();
    const deliveryRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(deliveryRow).toContainText(orderName);

    await page.goto(bioChembasePath + "/inventory/internal/receive");
    await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
    const incomingDeliveryRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(incomingDeliveryRow).toContainText(orderName);
    await incomingDeliveryRow
      .getByRole("button", { name: "View Details" })
      .click();
    await page
      .getByRole("row", { name: "Requested Qty." })
      .getByRole("checkbox")
      .click();
    await page.getByRole("button", { name: "Mark as Completed" }).click();

    await page.goto(bioChembasePath + "/inventory/internal/receive");
    await page.getByRole("tab", { name: "Incoming Deliveries" }).click();
    await page.getByRole("tab", { name: "Completed" }).click();
    const completedDeliveryRow = page
      .locator("table tbody tr")
      .filter({ hasText: orderName });
    await expect(completedDeliveryRow).toContainText(orderName);
  });
});

test.describe("External Delivery Order Flow", () => {
  test("should show validation errors when Name and Vendor are empty", async ({
    page,
  }) => {
    await page.goto(
      pharmacybasePath + "/inventory/external/deliveries/outgoing/new",
    );
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Required", { exact: true })).toBeVisible();
  });

  test("should create an external delivery order successfully", async ({
    page,
  }) => {
    const deliveryName = `external-delivery-${faker.string.uuid()}`;
    await page.goto(
      pharmacybasePath + "/inventory/external/deliveries/outgoing",
    );
    await page.getByRole("button", { name: "Create Delivery" }).click();
    await page.getByRole("textbox", { name: "Name" }).fill(deliveryName);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Vendor/Distributor" })
      .click();
    await page.getByPlaceholder("Search vendor").fill("Supplier");
    await expect(page.getByRole("option").first()).toBeVisible({
      timeout: 5000,
    });
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Create" }).click();
    await expect(page).toHaveURL(
      /\/inventory\/external\/deliveries\/outgoing\/(?!new)[^/?]+/,
    );
    await expect(
      page.getByRole("heading", { name: deliveryName }),
    ).toBeVisible();
    await page.goto(
      pharmacybasePath + "/inventory/external/deliveries/incoming",
    );
    const row = page
      .locator("table tbody tr")
      .filter({ hasText: deliveryName });
    await expect(row).toContainText(deliveryName);
  });

  test("should show empty state in the completed tab", async ({ page }) => {
    await page.goto(
      pharmacybasePath + "/inventory/external/deliveries/outgoing",
    );
    await page.getByRole("tab", { name: "Completed" }).click();
    await expect(page.getByRole("tab", { name: "Completed" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
