import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

/**
 * Test data generator for pharmacy-related entities
 */
function generatePharmacyTestData() {
  const timestamp = Date.now();
  return {
    productKnowledge: {
      name: `Test Med ${timestamp}`,
      slug: `test-med-${timestamp}`,
      type: "medication",
      category: "medicine",
      description: "Test medicine for automated testing",
      baseUnit: "tablet",
      dosageForm: "tablet",
    },
    chargeItemDefinition: {
      title: `Medi ci ${timestamp}`,
      slug: `Medi-ci-${timestamp}`,
      basePrice: "100.00",
      mrp: "120.00",
      purchasePrice: "80.00",
      description: "Test charge item for automated testing",
    },
    requestOrder: {
      internal: {
        name: `Internal Order ${timestamp}`,
        note: "Test internal order for automated testing",
        priority: "routine",
        reason: "stock-replenishment",
      },
      external: {
        name: `External Order ${timestamp}`,
        note: "Test external order for automated testing",
        priority: "routine",
        reason: "stock-replenishment",
        supplier: "Test Supplier",
      },
    },
  };
}

test.describe("Inventory Management", () => {
  let facilityId: string;
  let testData: ReturnType<typeof generatePharmacyTestData>;

  test.beforeEach(async ({ page }) => {
    testData = generatePharmacyTestData();

    // Navigate to home page (user is already authenticated)
    await page.goto("/");

    // Navigate to a facility with inventory capabilities
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    // Extract facility ID from URL
    const url = page.url();
    const facilityMatch = url.match(/\/facility\/([^/]+)/);
    facilityId = facilityMatch ? facilityMatch[1] : "";
    expect(facilityId).toBeTruthy();
  });

  test.describe("Product Knowledge Management", () => {
    test("should create a new product knowledge entry", async ({ page }) => {
      // Step to manage category - check if "Test Category" exists
      await test.step("Search for Test Category", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page
          .getByRole("button", { name: "Settings", exact: true })
          .click();
        await page.getByRole("link", { name: /product knowledge/i }).click();

        // Search for "Test Category"
        await page
          .getByRole("textbox", { name: /search/i })
          .fill("Test Category");
        await page.waitForTimeout(1000); // Wait for search results
      });

      // If Test Category exists, use it; if not, create it
      const testCategoryExists =
        (await page
          .locator("div")
          .filter({ hasText: /^Test Category$/ })
          .count()) > 0;

      if (!testCategoryExists) {
        await test.step("Create Test Category", async () => {
          // Create new category
          await page.getByRole("button", { name: /add category/i }).click();
          await page
            .getByRole("textbox", { name: /name/i })
            .fill("Test Category");
          await page.getByRole("button", { name: /create/i }).click();

          // Wait for success message
          await expect(
            page.getByText(/category.*created successfully/i),
          ).toBeVisible({
            timeout: 10000,
          });
        });
      } else {
        await test.step("Use existing Test Category", async () => {
          await page
            .locator("div")
            .filter({ hasText: /^Test Category$/ })
            .nth(3)
            .click();
        });
      }

      // Now proceed with creating product knowledge
      await test.step("Create new product knowledge", async () => {
        await page
          .getByRole("button", { name: /add product knowledge/i })
          .click();

        // Fill basic information
        await page
          .getByRole("textbox", { name: /name/i })
          .fill(testData.productKnowledge.name);

        // The slug should auto-generate, but we can verify it
        const slugField = page.getByRole("textbox", { name: /slug/i });
        await expect(slugField).toHaveValue(/test-med-/);

        // Select product type
        await page.getByRole("combobox", { name: /product type/i }).click();
        await page.getByRole("option", { name: "medication" }).click();

        // Select base unit
        await page
          .getByRole("combobox")
          .filter({ hasText: "Select base unit" })
          .click();
        await page.getByRole("option", { name: "tablets" }).click();
      });

      await test.step("Add product definition", async () => {
        // Add product definition section
        await page.getByRole("combobox", { name: "Dosage Form *" }).click();
        await page.getByRole("option").first().click();
      });

      await test.step("Save product knowledge", async () => {
        await page.getByRole("button", { name: /save/i }).click();

        // Wait for success message
        await expect(
          page.getByText(/product knowledge.*created successfully/i),
        ).toBeVisible({ timeout: 10000 });
      });
    });

    test("should view and edit existing product knowledge", async ({
      page,
    }) => {
      // First create a product knowledge entry
      await test.step("Navigate and create product knowledge", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page
          .getByRole("button", { name: "Settings", exact: true })
          .click();
        await page.getByRole("link", { name: /product knowledge/i }).click();

        await page
          .getByRole("textbox", { name: /search/i })
          .fill("Test Category");
        await page.waitForTimeout(1000);
        await page
          .locator("div")
          .filter({ hasText: /^Test Category$/ })
          .nth(3)
          .click();

        await page.getByRole("link").filter({ hasText: /^$/ }).first().click();

        await page
          .getByRole("textbox", { name: /name/i })
          .fill(testData.productKnowledge.name);

        const updatedName = `${testData.productKnowledge.name} Updated`;
        await page.getByRole("textbox", { name: /name/i }).fill(updatedName);

        await page.getByRole("combobox", { name: /product type/i }).click();
        await page.getByRole("option", { name: "medication" }).click();

        await page.getByRole("combobox", { name: /form/i }).click();
        await page.getByRole("option", { name: /tablet/i }).click();

        await page.getByRole("button", { name: /save/i }).click();
        await expect(
          page.getByText(/product knowledge.* updated successfully/i),
        ).toBeVisible({ timeout: 10000 });
      });
    });
  });

  test.describe("Charge Item Definition Management", () => {
    test("should create a new charge item definition", async ({ page }) => {
      // Step to manage category - check if "Test Category" exists
      await test.step("Search for Test Category", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page
          .getByRole("button", { name: "Settings", exact: true })
          .click();
        await page
          .getByRole("link", { name: /charge item definitions/i })
          .click();

        // Search for "Test Category"
        await page
          .getByRole("textbox", { name: /search/i })
          .fill("Medi Category");
        await page.waitForTimeout(1000); // Wait for search results
      });

      // If Test Category exists, use it; if not, create it
      const testCategoryExists =
        (await page
          .locator("div")
          .filter({ hasText: /^Medi Category$/ })
          .count()) > 0;

      if (!testCategoryExists) {
        await test.step("Create Test Category", async () => {
          // Create new category
          await page.getByRole("button", { name: /add category/i }).click();
          await page
            .getByRole("textbox", { name: /name/i })
            .fill("Medi Category");
          await page.getByRole("button", { name: /create/i }).click();

          // Wait for success message
          await expect(
            page.getByText(/category.*created successfully/i),
          ).toBeVisible({
            timeout: 10000,
          });
        });
      } else {
        await test.step("Use existing Test Category", async () => {
          await page
            .locator("div")
            .filter({ hasText: /^Medi Category$/ })
            .nth(3)
            .click();
        });
      }

      await test.step("Create new charge item definition", async () => {
        await page.getByRole("button", { name: /Add definition/i }).click();

        // Fill basic information
        await page
          .getByRole("textbox", { name: /title/i })
          .fill(testData.chargeItemDefinition.title);

        // Fill description
        await page
          .getByRole("textbox", { name: /description/i })
          .fill(testData.chargeItemDefinition.description);
      });

      await test.step("Set pricing components", async () => {
        // Set base price
        await page
          .getByRole("textbox", { name: /base price/i })
          .fill(testData.chargeItemDefinition.basePrice);

        // Set MRP
        await page
          .getByRole("textbox", { name: /mrp/i })
          .fill(testData.chargeItemDefinition.mrp);

        // Set purchase price
        await page
          .getByRole("textbox", { name: /purchase price/i })
          .fill(testData.chargeItemDefinition.purchasePrice);
      });

      await test.step("Save charge item definition", async () => {
        await page.getByRole("button", { name: /create/i }).click();

        // Wait for success message
        await expect(
          page.getByText(/charge item definition.*created successfully/i),
        ).toBeVisible({ timeout: 10000 });
      });
    });

    test("should validate required fields for charge item definition", async ({
      page,
    }) => {
      // Step to manage category - check if "Test Category" exists
      await test.step("Search for Test Category", async () => {
        await page.getByRole("button", { name: "Toggle Sidebar" }).click();
        await page
          .getByRole("button", { name: "Settings", exact: true })
          .click();
        await page
          .getByRole("link", { name: /charge item definitions/i })
          .click();

        // Search for "Test Category"
        await page
          .getByRole("textbox", { name: /search/i })
          .fill("Medi Category");
        await page.waitForTimeout(1000); // Wait for search results
      });

      // If Test Category exists, use it; if not, create it
      const testCategoryExists =
        (await page
          .locator("div")
          .filter({ hasText: /^Medi Category$/ })
          .count()) > 0;

      if (!testCategoryExists) {
        await test.step("Create Test Category", async () => {
          // Create new category
          await page.getByRole("button", { name: /add category/i }).click();
          await page
            .getByRole("textbox", { name: /name/i })
            .fill("Medi Category");
          await page.getByRole("button", { name: /create/i }).click();

          // Wait for success message
          await expect(
            page.getByText(/category.*created successfully/i),
          ).toBeVisible({
            timeout: 10000,
          });
        });
      } else {
        await test.step("Use existing Test Category", async () => {
          await page
            .locator("div")
            .filter({ hasText: /^Medi Category$/ })
            .nth(3)
            .click();
        });
      }

      await test.step("Attempt to create without required fields", async () => {
        await page.getByRole("button", { name: /add definition/i }).click();

        // Try to save without filling required fields
        await page.getByRole("button", { name: /create/i }).click();

        // Verify validation errors appear
        await expect(
          page.getByText(/required|not valid|invalid/i).first(),
        ).toBeVisible();
      });
    });
  });

  test.describe("Product Order Management", () => {
    //Bio-Chemistry Lab request for 2 items
    test("Create an internal product order", async ({ page }) => {
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
        await page.getByRole("link", { name: /outgoing orders/i }).click();
      });

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
        await page.getByRole("option", { name: "Pharmacy" }).click();
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
        await page.waitForTimeout(1000);
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page.getByRole("option", { name: "Gloves" }).click();
        await page.getByRole("combobox").click();
        await page
          .getByPlaceholder("Search Product Knowledge")
          .fill("Ibuprofen");
        await page.waitForTimeout(1000);
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page.getByRole("option", { name: "Ibuprofen" }).click();
        // Target the quantity input for each item specifically using the name attribute
        await page.locator('input[name="requests.1.quantity"]').fill("2");

        await page.getByRole("button", { name: "Add Items" }).click();
        await page.waitForTimeout(1000);

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
      await page.waitForTimeout(1000);
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
        await page.waitForTimeout(1000);
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
        await page.waitForTimeout(1000);
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page.getByRole("option", { name: "Gloves" }).click();
        await page.getByRole("combobox").click();
        await page
          .getByPlaceholder("Search Product Knowledge")
          .fill("Ibuprofen");
        await page.waitForTimeout(1000);
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page.getByRole("option", { name: "Ibuprofen" }).click();
        // Target the quantity input for each item specifically using the name attribute
        await page.locator('input[name="requests.1.quantity"]').fill("2");

        await page.getByRole("button", { name: "Add Items" }).click();

        await page.getByRole("button", { name: "Mark as Approved" }).click();
        await page.waitForTimeout(1000);

        // Wait for success message or navigation
        await expect(page.getByText(/created successfully/i)).toBeVisible({
          timeout: 10000,
        });
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

      await test.step("Add items to the order", async () => {
        // Click on add items button

        await page.getByRole("combobox").filter({ hasText: /^$/ }).click();
        await page.getByPlaceholder("Search Product Knowledge").click();
        await page
          .getByPlaceholder("Search Product Knowledge")
          .fill("Amoxicillin");
        await page.getByRole("option", { name: "Amoxicillin" }).click();
        await page.getByRole("spinbutton").fill("10");
        await page
          .getByRole("combobox")
          .filter({ hasText: "Search Product" })
          .click();
        await page.getByRole("option").first().click();

        await page.getByRole("button", { name: "Add Items" }).click();
        await expect(page.getByText(/created/i)).toBeVisible({
          timeout: 10000,
        });

        //mark the first item as entered in error
        await page.getByRole("cell").filter({ hasText: /^$/ }).first().click();
        await page
          .getByRole("menuitem", { name: "Mark as entered in error" })
          .click();
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
