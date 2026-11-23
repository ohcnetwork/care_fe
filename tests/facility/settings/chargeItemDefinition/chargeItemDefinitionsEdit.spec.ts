import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { createChargeItemDefinitionViaUi } from "tests/helper/definitions";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Charge Item Definition Edit operations", () => {
  let facilityId: string;
  let title: string;
  let basePrice: string;
  let mrp: string;
  let purchasePrice: string;
  let description: string;
  let purpose: string;
  let url: string;
  let categoryName: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    title = faker.string.alphanumeric(10);
    basePrice = faker.commerce.price({ dec: 0 });
    mrp = faker.commerce.price({ dec: 0 });
    purchasePrice = faker.commerce.price({ dec: 0 });
    description = faker.commerce.productDescription();
    purpose = faker.commerce.productAdjective();
    url = faker.internet.url();
    categoryName = "Medications";
  });

  test(
    "edit charge item definition",
    { tag: ["@atomic", "@cap:definition.chargeitem.edit"] },
    async ({ page }) => {
      // Edit a definition of this test's own: renaming or repricing a fixture
      // definition breaks the billing and medication specs that pick it by name.
      const created = await createChargeItemDefinitionViaUi(page, {
        facilityId,
        categoryName,
      });

      // Find it in the category list (retry to handle search indexing delay)
      await expect(async () => {
        await page.getByRole("textbox", { name: /search/i }).clear();
        await page.getByRole("textbox", { name: /search/i }).fill(created.name);
        await expect(
          page.getByRole("table").getByText(created.name),
        ).toBeVisible();
      }).toPass({ intervals: [2_000, 3_000, 5_000], timeout: 30_000 });

      await page
        .locator('[data-slot="table-body"]')
        .getByRole("row")
        .filter({ hasText: created.name })
        .getByRole("link", { name: "Edit" })
        .click();
      await page
        .getByRole("textbox", { name: /title/i })
        .fill(title + " - edited");
      await page
        .getByRole("textbox", { name: /description/i })
        .fill(description + " - edited");
      await page
        .getByRole("textbox", { name: /purpose/i })
        .fill(purpose + " - edited");
      await page.getByRole("textbox", { name: /uri/i }).fill(url);
      await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);
      await page.getByRole("textbox", { name: /mrp/i }).fill(mrp);
      await page
        .getByRole("textbox", { name: /purchase price/i })
        .fill(purchasePrice);
      await page.getByRole("button", { name: /update/i }).click();

      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText(/updated successfully/i),
      ).toBeVisible();

      await expect(async () => {
        const searchBox = page.getByRole("textbox", { name: /Search/i });
        await searchBox.clear();
        await searchBox.fill(title + " - edited");
        await expect(
          page.getByRole("table").getByText(title + " - edited"),
        ).toBeVisible();
      }).toPass({ intervals: [1_000, 2_000, 3_000], timeout: 15_000 });
    },
  );
});
