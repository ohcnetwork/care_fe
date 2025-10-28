import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

function generateProductKnowledgeData() {
  return {
    productKnowledge: {
      name: faker.commerce.productName(),
      slug: faker.commerce
        .productName()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .slice(0, 25),
      type: "medication",
      description: "Test medicine for automated testing",
      baseUnit: "tablet",
      dosageForm: "tablet",
    },
  };
}

test.describe(() => {
  let testData: ReturnType<typeof generateProductKnowledgeData> =
    generateProductKnowledgeData();

  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    await test.step("Navigate to Product Knowledge", async () => {
      await page.getByRole("button", { name: "Toggle Sidebar" }).click();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await page.getByRole("link", { name: /product knowledge/i }).click();

      // Search for "Medical Products Category"
      await page
        .getByRole("textbox", { name: /search/i })
        .fill("Medical Products Category");
      await page
        .locator("div", { hasText: /^Medical Products Category$/ })
        .first()
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});
    });

    const testCategoryExists =
      (await page
        .locator("div")
        .filter({ hasText: /^Medical Products Category$/ })
        .count()) > 0;

    if (!testCategoryExists) {
      await test.step("Create Medical Products Category", async () => {
        await page.getByRole("button", { name: /add category/i }).click();
        await page
          .getByRole("textbox", { name: /name/i })
          .fill("Medical Products Category");
        await page.getByRole("button", { name: /create/i }).click();

        await expect(
          page.getByText(/category.*created successfully/i),
        ).toBeVisible();
      });
    } else {
      await test.step("Use existing Medical Products Category", async () => {
        await page
          .locator("div")
          .filter({ hasText: /^Medical Products Category$/ })
          .nth(3)
          .click();
      });
    }
  });

  test("validate", async ({ page }) => {
    await test.step("Attempt to create without required fields", async () => {
      await page.getByRole("button", { name: /add product/i }).click();
      await page.getByRole("button", { name: /save/i }).click();

      await expect(
        page.getByText(/required|not valid|invalid/i).first(),
      ).toBeVisible();
    });
  });

  test("create", async ({ page }) => {
    await test.step("Create new product knowledge", async () => {
      await page.getByRole("button", { name: /add product/i }).click();

      await page
        .getByRole("textbox", { name: /name/i })
        .fill(testData.productKnowledge.name);
      await page
        .getByRole("textbox", { name: /slug/i })
        .fill(testData.productKnowledge.slug);
      await page.getByRole("combobox", { name: /product type/i }).click();
      await page.getByRole("option", { name: "medication" }).click();
      await page
        .getByRole("combobox")
        .filter({ hasText: "Select base unit" })
        .click();
      await page.getByRole("option", { name: "tablets" }).click();
      await page.getByRole("combobox", { name: "Dosage Form" }).click();
      await page.getByRole("option").first().click();
    });

    await test.step("Save product knowledge", async () => {
      await page.getByRole("button", { name: /save/i }).click();

      // Wait for success message
      await expect(
        page.getByText(/product knowledge.*created successfully/i),
      ).toBeVisible();
    });
  });

  test("view and edit", async ({ page }) => {
    await test.step("search for newly created product knowledge then edit it", async () => {
      await page
        .getByRole("textbox", { name: "Search products" })
        .fill(testData.productKnowledge.name);
      await page.getByRole("link", { name: "View" }).nth(1).click();
      await page.getByRole("button", { name: "Edit" }).click();

      // Edit some fields
      await page.getByRole("button", { name: "Remove Definition" }).click();

      await page.getByRole("button", { name: /save/i }).click();
      await expect(page.getByText(/updated successfully/i)).toBeVisible();
    });
  });

  test("delete", async ({ page }) => {
    await page
      .getByRole("textbox", { name: "Search products" })
      .fill(testData.productKnowledge.name);
    await page.getByRole("link", { name: "View" }).nth(1).click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/product knowledge.*deleted successfully/i),
    ).toBeVisible();
  });
});
