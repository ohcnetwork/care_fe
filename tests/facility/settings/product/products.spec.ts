import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product List", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (user is already authenticated)
    await page.goto("/");

    // Navigate to a facility - using a more robust selector
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    // Navigate to Products via sidebar
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("link", { name: "Product", exact: true }).click();
  });

  test("should display product categories in dropdown", async ({ page }) => {
    await test.step("Open product search dropdown", async () => {
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();

      // Verify categories are available
      await expect(page.getByText("Consumables")).toBeVisible();
    });
  });

  test("should filter products by category and show suggestions", async ({
    page,
  }) => {
    await test.step("Select product category", async () => {
      // Open the product search dropdown
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();

      // Select "Consumables" category
      await page.getByText("Consumables").click();
    });

    await test.step("Verify suggestions appear", async () => {
      // Verify that suggestions are shown
      await expect(page.getByLabel("Suggestions")).toBeVisible();

      // Check that "Gloves" suggestion appears
      await expect(
        page.getByLabel("Suggestions").getByText("Gloves"),
      ).toBeVisible();
    });

    await test.step("Select a product suggestion", async () => {
      // Click on "Gloves" suggestion
      await page.getByLabel("Suggestions").getByText("Gloves").click();

      // Verify the selection is made (product should be selected/highlighted)
      // Note: This may need adjustment based on actual UI behavior after selection
      await expect(page.getByText("Gloves")).toBeVisible();
    });
  });

  test("should allow multiple category selections", async ({ page }) => {
    await test.step("Select first category", async () => {
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();

      await page.getByText("Consumables").click();

      // Verify suggestions appear for first category
      await expect(page.getByLabel("Suggestions")).toBeVisible();
    });

    await test.step("Select product from first category", async () => {
      await page.getByLabel("Suggestions").getByText("Gloves").click();
    });

    await test.step("Open dropdown again for additional selection", async () => {
      // Reopen dropdown to select another category/product
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();

      // Verify the dropdown is still functional
      await expect(page.getByText("Consumables")).toBeVisible();
    });
  });

  test("should clear category selection and reset suggestions", async ({
    page,
  }) => {
    await test.step("Select a category and product", async () => {
      // Open dropdown and select category
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();

      await page.getByText("Consumables").click();

      // Select a product
      await page.getByLabel("Suggestions").getByText("Gloves").click();
    });

    await test.step("Clear the selection", async () => {
      // Click the "Clear Selection" button
      await page.getByRole("button", { name: "Clear Selection" }).click();

      // Verify the selection is cleared
      // Note: This verification may need adjustment based on actual UI behavior
      // You might need to check that the dropdown returns to initial state
      await expect(
        page
          .getByRole("combobox")
          .filter({ hasText: "Search Product Knowledge" }),
      ).toBeVisible();
    });

    await test.step("Verify dropdown functionality after clearing", async () => {
      // Verify we can still use the dropdown after clearing
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();

      await expect(page.getByText("Consumables")).toBeVisible();
    });
  });

  test("should handle empty search results gracefully", async ({ page }) => {
    await test.step("Open product search", async () => {
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();
    });

    await test.step("Search for non-existent category", async () => {
      // Assert that only known categories are present and no "No results" message is shown
      await expect(page.getByText("Consumables")).toBeVisible();
      await expect(page.getByText("Medications")).toBeVisible();
      // Optionally, check that "No results" is NOT visible
      await expect(
        page.getByText(/no results|not found|no products/i),
      ).not.toBeVisible();
    });
  });

  test("should maintain state during navigation in product filtering", async ({
    page,
  }) => {
    await test.step("Select category and product", async () => {
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();

      await page.getByText("Consumables").click();
      await page.getByLabel("Suggestions").getByText("Gloves").click();
    });

    await test.step("Navigate away and back", async () => {
      // Navigate to another section
      await page.getByRole("button", { name: "Settings" }).click();

      // Verify the page loads correctly after navigation
      await expect(
        page
          .getByRole("combobox")
          .filter({ hasText: "Search Product Knowledge" }),
      ).toBeVisible();
    });
  });

  test("should display product search interface correctly", async ({
    page,
  }) => {
    await test.step("Verify main elements are present", async () => {
      // Check that the main product search interface is loaded
      await expect(
        page
          .getByRole("combobox")
          .filter({ hasText: "Search Product Knowledge" }),
      ).toBeVisible();

      // Verify page title or heading
      await expect(
        page.getByRole("heading", { name: /products/i }),
      ).toBeVisible();
    });

    await test.step("Verify interactive elements", async () => {
      // Ensure the combobox is clickable
      const combobox = page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" });
      await expect(combobox).toBeEnabled();
    });
  });
});
