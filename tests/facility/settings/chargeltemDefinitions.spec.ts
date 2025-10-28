import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

function generatePharmacyTestData() {
  return {
    chargeItemDefinition: {
      title: faker.commerce.productName(),
      slug: `${faker.commerce.productName().toLowerCase().replace(/\s+/g, "-")}`.slice(
        0,
        25,
      ),
      basePrice: faker.commerce.price(),
      mrp: faker.commerce.price(),
      purchasePrice: faker.commerce.price(),
      description: faker.commerce.productDescription(),
    },
  };
}

test.describe(() => {
  let testData: ReturnType<typeof generatePharmacyTestData> =
    generatePharmacyTestData();

  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    await test.step("Search for Test Category", async () => {
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page
        .getByRole("link", { name: /charge item definitions/i })
        .click();

      // Search for "Medi Category"
      await page
        .getByRole("textbox", { name: /search/i })
        .fill("Medi Category");
      await page
        .locator("div", { hasText: /^Medi Category$/ })
        .first()
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});
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
        ).toBeVisible();
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
  });

  test("validate", async ({ page }) => {
    await test.step("Attempt to create without required fields", async () => {
      await page.getByRole("button", { name: /add definition/i }).click();

      await page.getByRole("button", { name: /create/i }).click();

      await expect(
        page.getByText(/required|not valid|invalid/i).first(),
      ).toBeVisible();
    });
  });

  test("create", async ({ page }) => {
    await test.step("Create new charge item definition", async () => {
      await page.getByRole("button", { name: /Add definition/i }).click();

      await page
        .getByRole("textbox", { name: /title/i })
        .fill(testData.chargeItemDefinition.title);

      await page
        .getByRole("textbox", { name: /description/i })
        .fill(testData.chargeItemDefinition.description);
    });

    // Set pricing components
    await test.step("Set pricing components", async () => {
      await page
        .getByRole("textbox", { name: /base price/i })
        .fill(testData.chargeItemDefinition.basePrice);

      await page
        .getByRole("textbox", { name: /mrp/i })
        .fill(testData.chargeItemDefinition.mrp);

      await page
        .getByRole("textbox", { name: /purchase price/i })
        .fill(testData.chargeItemDefinition.purchasePrice);
    });

    await test.step("Save charge item definition", async () => {
      await page.getByRole("button", { name: /create/i }).click();

      // Wait for success message
      await expect(
        page.getByText(/charge item definition.*created successfully/i),
      ).toBeVisible();
    });
  });

  test("view and edit", async ({ page }) => {
    await test.step("search for newly created charge item definition view then edit it", async () => {
      await page
        .getByRole("textbox", { name: "Search definitions" })
        .fill(testData.chargeItemDefinition.title);
      await page.getByRole("link", { name: "View" }).nth(1).click();
      await page.getByRole("button", { name: "Edit" }).click();
      await page
        .getByRole("textbox", { name: "Description" })
        .fill("Edited description for test");
      await page.getByRole("button", { name: /update/i }).click();
      await expect(page.getByText(/updated successfully/i)).toBeVisible();
    });
  });

  test("delete", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(testData.chargeItemDefinition.title);
    await page.getByRole("link", { name: "View" }).nth(1).click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/charge item definition.*deleted successfully/i),
    ).toBeVisible();
  });
});
