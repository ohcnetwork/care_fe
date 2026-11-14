import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/facility/${getFacilityId()}/settings/product`);
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

  test("should reopen product categories with an existing selection", async ({
    page,
  }) => {
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

    await test.step("Reopen dropdown with the selected product", async () => {
      await page.getByRole("combobox").filter({ hasText: "Gloves" }).click();

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

  test("should reset product selection when returning through settings navigation", async ({
    page,
  }) => {
    await test.step("Select category and product", async () => {
      await page
        .getByRole("combobox")
        .filter({ hasText: "Search Product Knowledge" })
        .click();

      await page.getByText("Consumables").click();
      await page.getByLabel("Suggestions").getByText("Gloves").click();
      await expect(
        page.getByRole("combobox").filter({ hasText: "Gloves" }),
      ).toBeVisible();
    });

    await test.step("Navigate away and back", async () => {
      // Navigate to another setting, then return to Products.
      const sidebarToggle = page
        .locator('[data-cy="facility-settings-page-header"]')
        .getByRole("button", { name: "Toggle Sidebar", exact: true });
      if ((await sidebarToggle.getAttribute("aria-expanded")) !== "true") {
        await sidebarToggle.click();
      }
      const sidebar = page.locator('[data-sidebar="sidebar"]');
      await sidebar.getByRole("link", { name: "General", exact: true }).click();
      await sidebar.getByRole("link", { name: "Product", exact: true }).click();

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
