import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createProductKnowledgeViaUi } from "tests/helper/definitions";
import { expectedSlug } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Knowledge Delete operations", () => {
  let facilityId: string;
  let name: string;
  let slug: string;
  let baseUnit: string;
  let categoryName: string;

  const baseUnitOptions = [
    "tablets",
    "milligram",
    "microgram",
    "milliliter",
    "drop",
    "international unit",
  ];

  test.beforeEach(() => {
    facilityId = getFacilityId();
    const productName = faker.commerce.productName();

    name = productName;
    slug = expectedSlug(productName);
    baseUnit = faker.helpers.arrayElement(baseUnitOptions);
    categoryName = "Medications";
  });

  test(
    "quick create and delete product knowledge",
    { tag: ["@atomic", "@cap:product.knowledge.delete"] },
    async ({ page }) => {
      // Without a medication definition: no dosage form to pick.
      await createProductKnowledgeViaUi(page, {
        facilityId,
        categoryName,
        name,
        slug,
        baseUnit,
        dosageForm: null,
      });

      await page.getByRole("textbox", { name: "Search products" }).fill(name);
      await expect(page.getByRole("table").getByText(name)).toBeVisible();
      await page.getByRole("link", { name: "View" }).first().click();
      await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
      await page.getByRole("button", { name: "Delete" }).click();
      await page.getByRole("button", { name: "Confirm" }).click();

      await expect(
        page.getByText(/product knowledge.*deleted successfully/i),
      ).toBeVisible();

      await page.getByRole("textbox", { name: "Search products" }).fill(name);
      await expect(page.getByRole("table").getByText(name)).toBeHidden();
    },
  );
});
