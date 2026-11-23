import {
  createChargeItemCategoryViaApi,
  createDraftDeliveryOrderViaApi,
  createProductKnowledgeViaApi,
  createProductViaUi,
} from "tests/helper/definitions";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

// Settings has no standalone product form: a product (a batch of a product
// knowledge) is created when a new batch is received on a delivery order.

test.describe("Product Create", () => {
  test(
    "should create a product from a new batch on a delivery order",
    { tag: ["@atomic", "@cap:product.create"] },
    async ({ page, facilityId }) => {
      const productKnowledge = await createProductKnowledgeViaApi({
        facilityId,
      });
      const category = await createChargeItemCategoryViaApi({ facilityId });
      const { orderId, locationId } = await createDraftDeliveryOrderViaApi({
        facilityId,
      });

      const { productId, lotNumber } = await createProductViaUi(page, {
        facilityId,
        locationId,
        deliveryOrderId: orderId,
        productKnowledgeName: productKnowledge.name,
        chargeItemCategory: category.title,
      });

      await test.step("Find the product in the product list", async () => {
        await page.goto(
          `/facility/${facilityId}/settings/product?product_knowledge_slug=${productKnowledge.slug}`,
        );
        const row = page.getByRole("row").filter({ hasText: lotNumber });
        await expect(row).toBeVisible();
        await expect(row).toContainText(productKnowledge.name);

        await row.getByRole("link", { name: "View" }).click();
        await expect(page).toHaveURL(
          new RegExp(`/settings/product/${productId}$`),
        );
      });

      await test.step("Verify the product details", async () => {
        await expect(
          page.getByRole("heading", { name: `Product: ${productId}` }),
        ).toBeVisible();
        // Exact: the product's new charge item definition is titled
        // "<product knowledge> - <batch>".
        await expect(
          page.getByRole("heading", {
            name: productKnowledge.name,
            exact: true,
          }),
        ).toBeVisible();
        await expect(page.getByText(`Lot Number: ${lotNumber}`)).toBeVisible();
      });
    },
  );
});
