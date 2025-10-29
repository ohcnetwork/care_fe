import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

function generateProductKnowledgeData() {
  return {
    productKnowledge: {
      name: "Atorvastatin",
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
    category: {
      name: "Medications",
    },
  };
}

test.describe(() => {
  let testData: ReturnType<typeof generateProductKnowledgeData> =
    generateProductKnowledgeData();

  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const targetUrl = `/facility/${facilityId}/settings/product_knowledge`;
    await page.goto(targetUrl);

    await test.step("Search for Test Category", async () => {
      await page
        .getByRole("textbox", { name: /search/i })
        .fill(testData.category.name);

      await page.waitForLoadState("networkidle");
    });

    const CategoryExists =
      (await page
        .locator("div", {
          hasText: testData.category.name,
        })
        .count()) > 0;

    if (!CategoryExists) {
      await test.step("Create Test Category", async () => {
        await page.getByRole("button", { name: /add category/i }).click();
        await page
          .getByRole("textbox", { name: /name/i })
          .fill(testData.category.name);
        await page.getByRole("button", { name: /create/i }).click();

        // Wait for success message
        await expect(
          page.getByText(/category.*created successfully/i),
        ).toBeVisible();
      });
    } else {
      await test.step("Use existing Test Category", async () => {
        await page
          .getByRole("heading", { name: testData.category.name })
          .click();
      });
    }
  });

  test("validate", async ({ page }) => {
    await page.getByRole("button", { name: /add product/i }).click();
    await page.getByRole("button", { name: /save/i }).click();

    await expect(
      page.getByText(/required|not valid|invalid/i).first(),
    ).toBeVisible();
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
      await expect(page.getByText(/.*created successfully/i)).toBeVisible();
    });
  });

  test("view and edit", async ({ page }) => {
    await test.step("search for newly created product knowledge then edit it", async () => {
      await page
        .getByRole("textbox", { name: "Search products" })
        .fill(testData.productKnowledge.name);
      await page
        .getByRole("link", { name: "View" })
        .waitFor({ state: "visible" });
      await page.getByRole("link", { name: "View" }).click();
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
    await page
      .getByRole("link", { name: "View" })
      .waitFor({ state: "visible" });
    await page.getByRole("link", { name: "View" }).click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(
      page.getByText(/product knowledge.*deleted successfully/i),
    ).toBeVisible();
  });
});
