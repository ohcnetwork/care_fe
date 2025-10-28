import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

function generatePharmacyTestData() {
  return {
    requestOrder: {
      internal: {
        name: faker.commerce.productName(),
        note: "Test internal order for automated testing",
        priority: "routine",
        reason: "stock-replenishment",
      },
      external: {
        name: faker.commerce.productName(),
        note: "Test external order for automated testing",
        priority: "routine",
        reason: "stock-replenishment",
      },
    },
  };
}

test.describe(() => {
  let facilityId: string = getFacilityId();
  let testData: ReturnType<typeof generatePharmacyTestData>;

  test.beforeEach(async ({ page }) => {
    testData = generatePharmacyTestData();

    const targetUrl = `/facility/${facilityId}/services`;
    await page.goto(targetUrl);
  });

  test.describe("Product Order Management", () => {
    //Bio-Chemistry Lab request for 2 items
    test("Create an internal product order", async ({ page }) => {
      await page
        .locator("div")
        .filter({ has: page.getByRole("heading", { name: "Pathology Lab" }) })
        .getByRole("button", { name: "View Details" })
        .first()
        .click();

      await page.getByRole("button", { name: "View Requests" }).click();
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      await page
        .getByRole("button", { name: "Inventory", exact: true })
        .click();
      await page.getByRole("link", { name: /outgoing orders/i }).click();

      await test.step("Create internal request order", async () => {
        await page.getByRole("button", { name: /create order/i }).click();

        // Fill order details
        await page
          .getByRole("textbox", { name: /name/i })
          .fill(testData.requestOrder.internal.name);

        await page
          .getByRole("textbox", { name: /note/i })
          .fill(testData.requestOrder.internal.note);

        // Select reason
        await page
          .locator("div")
          .filter({ hasText: /^Ward Stock$/ })
          .click();
        await page
          .locator("div")
          .filter({ hasText: /^Non Stock$/ })
          .click();
        await page.getByRole("combobox", { name: "Intent" }).click();
        await page.getByRole("option", { name: "Order", exact: true }).click();
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Location" })
          .click();
        await page.getByRole("option", { name: "daniel" }).click();
      });

      await test.step("Save internal order", async () => {
        await page.getByRole("button", { name: /create/i }).click();

        // Wait for success message or navigation
        await expect(page.getByText(/created successfully/i)).toBeVisible({
          timeout: 10000,
        });
      });

      await test.step("Add items to the order", async () => {
        // Click on add items button
        await page.getByRole("combobox").click();

        await page.getByRole("combobox").click();
        await page.getByPlaceholder("Search Product Knowledge").fill("Gloves");
        await expect(page.getByRole("option", { name: "Gloves" })).toBeVisible({
          timeout: 5000,
        });
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page.getByRole("option", { name: "Gloves" }).click();
        await page.getByRole("combobox").click();
        await page
          .getByPlaceholder("Search Product Knowledge")
          .fill("Ibuprofen");
        await expect(
          page.getByRole("option", { name: "Ibuprofen" }),
        ).toBeVisible({ timeout: 5000 });
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page.getByRole("option", { name: "Ibuprofen" }).click();
        // Target the quantity input for each item specifically using the name attribute
        await page.locator('input[name="requests.1.quantity"]').fill("2");

        await page.getByRole("button", { name: "Add Items" }).click();
        await expect(
          page.getByRole("button", { name: "Mark as Approved" }),
        ).toBeEnabled();

        await page.getByRole("button", { name: "Mark as Approved" }).click();
      });
    });

    //Delivery 2 items to Bio-Chemistry
    test("Delivery of internal product order", async ({ page }) => {
      await test.step("Navigate to inventory section", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page.getByRole("link", { name: "Services", exact: true }).click();
        await page
          .locator("div")
          .filter({ hasText: /^Main PharmacyView Details$/ })
          .nth(1)
          .click();
        await page.getByRole("button", { name: "View Details" }).nth(1).click();
        await page.locator(".p-6").click();
        await page.getByRole("button", { name: "View Prescriptions" }).click();
        await page.getByRole("button", { name: "Inventory" }).click();
        await page.getByRole("link", { name: "Incoming Orders" }).click();
      });

      await test.step("Select an order", async () => {
        await page.getByRole("button", { name: "See Details" }).first().click();

        await page.getByRole("link", { name: "Create Delivery Order" }).click();
        await test.step("Save internal order", async () => {
          await page.getByRole("button", { name: /create/i }).click();

          // Wait for success message or navigation
          await expect(page.getByText(/created successfully/i)).toBeVisible({
            timeout: 10000,
          });
        });
      });

      await page.getByRole("button", { name: "Load from order" }).click();
      await page.getByRole("button", { name: "Done" }).click();

      await page.getByRole("button", { name: "Select stock" }).nth(1).click();
      await page.getByRole("checkbox").click();
      //clickoutside to close the dropdown
      await page.locator("div").first().click();
      await page.waitForSelector(".dropdown-menu", { state: "hidden" });
      await page.getByRole("button", { name: "Select stock" }).nth(1).click();
      await page.getByRole("checkbox").click();

      await page.getByRole("button", { name: "Add Items" }).click();

      await expect(page.getByText(/created successfully/i)).toBeVisible({
        timeout: 10000,
      });

      //mark as approved
      await page.getByRole("button", { name: "Mark as Approved" }).click();
    });

    //Bio-Chemistry Accept Delivery
    test("Accept the delivery for internal", async ({ page }) => {
      await test.step("Navigate to inventory section", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page.getByRole("link", { name: "Services", exact: true }).click();
        await page
          .locator("div")
          .filter({ hasText: /^Pathology LabView Details$/ })
          .nth(1)
          .click();
        await page
          .getByRole("button", { name: "View Details" })
          .first()
          .click();
        await page.locator(".p-6").click();
        await page.getByRole("button", { name: "View Requests" }).click();
        await page
          .getByRole("button", { name: "Inventory", exact: true })
          .click();
        await page.getByRole("link", { name: /Incoming Deliveries/i }).click();
      });

      await test.step("Select an order and accept", async () => {
        await page
          .getByRole("button", { name: "view Details" })
          .first()
          .click();

        await page
          .locator("thead")
          .getByRole("cell")
          .filter({ hasText: /^$/ })
          .click();
        await page
          .getByRole("button", { name: "Confirm & Update Stock" })
          .click();
        await page.getByRole("button", { name: "Confirm" }).click();
        await page.getByRole("button", { name: "Mark as Completed" }).click();

        // Wait for success message or navigation
        await expect(page.getByText(/successfully/i)).toBeVisible({
          timeout: 10000,
        });
      });
    });

    test("Mark as completed/successful delivery for Internal order", async ({
      page,
    }) => {
      await test.step("Navigate to inventory section", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page.getByRole("link", { name: "Services", exact: true }).click();
        await page
          .locator("div")
          .filter({ hasText: /^Pathology LabView Details$/ })
          .nth(1)
          .click();
        await page
          .getByRole("button", { name: "View Details" })
          .first()
          .click();
        await page.locator(".p-6").click();
        await page.getByRole("button", { name: "View Requests" }).click();
        await page
          .getByRole("button", { name: "Inventory", exact: true })
          .click();
        await page.getByRole("link", { name: /Outgoing Orders/i }).click();
      });

      await test.step("Select an order", async () => {
        await page.getByRole("button", { name: "See Details" }).first().click();

        await page.getByRole("button").filter({ hasText: /^$/ }).nth(2).click();
        await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
        // Wait for success message or navigation
        await expect(page.getByText(/successfully/i)).toBeVisible({
          timeout: 10000,
        });
      });
    });

    test("Create an external product order", async ({ page }) => {
      await test.step("Navigate to inventory section", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page.getByRole("link", { name: "Services", exact: true }).click();
        await page
          .locator("div")
          .filter({ hasText: /^Main PharmacyView Details$/ })
          .nth(1)
          .click();
        await page.getByRole("button", { name: "View" }).first().click();
        await page.locator(".p-6").click();
        await page.getByRole("button", { name: "View Requests" }).click();
        await page
          .getByRole("button", { name: "Inventory", exact: true })
          .click();
        await page.getByRole("link", { name: /Purchase Orders/i }).click();
      });

      await test.step("Create external request order", async () => {
        await page.getByRole("button", { name: /create order/i }).click();

        // Fill order details
        await page
          .getByRole("textbox", { name: /name/i })
          .fill(testData.requestOrder.external.name);

        await page
          .getByRole("textbox", { name: /note/i })
          .fill(testData.requestOrder.external.note);

        // Select reason
        await page
          .locator("div")
          .filter({ hasText: /^Ward Stock$/ })
          .click();
        await page
          .locator("div")
          .filter({ hasText: /^Non Stock$/ })
          .click();
        await page.getByRole("combobox", { name: "Intent" }).click();
        await page.getByRole("option", { name: "Order", exact: true }).click();
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select Vendor" })
          .click();
        await page.waitForSelector('[role="option"]');
        await page.getByRole("option").first().click();
      });

      await test.step("Save order", async () => {
        await page.getByRole("button", { name: /create/i }).click();

        // Wait for success message or navigation
        await expect(page.getByText(/created successfully/i)).toBeVisible({
          timeout: 10000,
        });
      });

      await test.step("Add items to the order", async () => {
        // Click on add items button
        await page.getByRole("combobox").click();

        await page.getByRole("combobox").click();
        await page.getByPlaceholder("Search Product Knowledge").fill("Gloves");
        await page.getByRole("option", { name: "Gloves" }).waitFor();
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page.getByRole("option", { name: "Gloves" }).click();
        await page.getByRole("combobox").click();
        await page
          .getByPlaceholder("Search Product Knowledge")
          .fill("Ibuprofen");
        await page.getByRole("option", { name: "Ibuprofen" }).waitFor();
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page.getByRole("option", { name: "Ibuprofen" }).click();
        // Target the quantity input for each item specifically using the name attribute
        await page.locator('input[name="requests.1.quantity"]').fill("2");

        await page.getByRole("button", { name: "Add Items" }).click();
        // Wait for success message or navigation
        await expect(page.getByText(/.* successfully/i)).toBeVisible({
          timeout: 10000,
        });
        await page.getByRole("button", { name: "Mark as Approved" }).click();
        await page.waitForTimeout(1000);
      });
    });

    test("Delivery of external product order", async ({ page }) => {
      await test.step("Navigate to inventory section", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page.getByRole("link", { name: "Services", exact: true }).click();
        await page
          .locator("div")
          .filter({ hasText: /^Main PharmacyView Details$/ })
          .nth(1)
          .click();
        await page.getByRole("button", { name: "View" }).first().click();
        await page.locator(".p-6").click();
        await page.getByRole("button", { name: "View Requests" }).click();
        await page
          .getByRole("button", { name: "Inventory", exact: true })
          .click();
        await page.getByRole("link", { name: /Purchase Orders/i }).click();
      });

      await test.step("Select an order", async () => {
        await page.getByRole("button", { name: "See Details" }).first().click();

        await page.getByRole("link", { name: "Create Delivery Order" }).click();
        await test.step("Save internal order", async () => {
          await page.getByRole("button", { name: /create/i }).click();

          // Wait for success message or navigation
          await expect(page.getByText(/created successfully/i)).toBeVisible({
            timeout: 10000,
          });
        });
      });

      await page.getByRole("button", { name: "Load from order" }).click();
      await page.getByRole("button", { name: "Done" }).click();
      await page.getByRole("combobox").nth(2).click();
      await page.getByRole("option").first().click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product" })
        .click();
      await page.getByRole("option").first().click();
      await page.getByRole("button", { name: "Add Items" }).click();

      await expect(page.getByText(/created successfully/i)).toBeVisible({
        timeout: 10000,
      });

      await page.getByRole("button", { name: "Mark as Approved" }).click();
      await page
        .getByRole("row", { name: "Item Requested Qty. Received" })
        .getByRole("checkbox")
        .click();
      await page
        .getByRole("button", { name: "Confirm & Update Stock" })
        .click();
      await page.getByRole("button", { name: "Confirm" }).click();
      await page.getByRole("button", { name: "Mark as Completed" }).click();
    });

    test("Mark as completed/successful delivery for External order", async ({
      page,
    }) => {
      await test.step("Navigate to inventory section", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page.getByRole("link", { name: "Services", exact: true }).click();
        await page
          .locator("div")
          .filter({ hasText: /^Main PharmacyView Details$/ })
          .nth(1)
          .click();
        await page.getByRole("button", { name: "View" }).first().click();
        await page.locator(".p-6").click();
        await page.getByRole("button", { name: "View Requests" }).click();
        await page
          .getByRole("button", { name: "Inventory", exact: true })
          .click();
        await page.getByRole("link", { name: /Purchase Orders/i }).click();
      });

      await test.step("Select an order", async () => {
        await page.getByRole("button", { name: "See Details" }).first().click();

        await page.getByRole("button").filter({ hasText: /^$/ }).nth(2).click();
        await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
        // Wait for success message or navigation
        await expect(page.getByText(/successfully/i)).toBeVisible({
          timeout: 10000,
        });
      });
    });

    test("should validate order creation with missing required fields", async ({
      page,
    }) => {
      await test.step("Navigate and attempt invalid order creation", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page.getByRole("link", { name: "Services", exact: true }).click();
        await page
          .locator("div")
          .filter({ hasText: /^Main PharmacyView Details$/ })
          .nth(1)
          .click();
        await page.getByRole("button", { name: "View" }).first().click();
        await page.locator(".p-6").click();
        await page.getByRole("button", { name: "View Requests" }).click();
        await page
          .getByRole("button", { name: "Inventory", exact: true })
          .click();
        await page.getByRole("link", { name: /Purchase Orders/i }).click();

        await page.getByRole("button", { name: /create order/i }).click();

        // Attempt to create order without filling required fields

        await test.step("Save internal order", async () => {
          await page.getByRole("button", { name: /create/i }).click();

          // Wait for success message or navigation
          await expect(
            page.getByText(/required|not valid|invalid/i).first(),
          ).toBeVisible();
        });
      });
    });
  });
});
