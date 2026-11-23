import { createProductViaApi } from "tests/helper/definitions";
import { expect, test } from "tests/support/test";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Product Edit", () => {
  test(
    "should update product status and revert",
    { tag: ["@atomic", "@cap:product.edit"] },
    async ({ page, facilityId }) => {
      // Edit a product of this test's own: toggling a fixture product's status
      // hides it from the specs that stock, bill or dispense it.
      const { productId } = await createProductViaApi({ facilityId });
      await page.goto(`/facility/${facilityId}/settings/product/${productId}`);

      await page.getByRole("button", { name: "Edit" }).click();

      await page.getByLabel("Status").click();
      await page.getByRole("option", { name: "Inactive" }).click();
      await page.getByRole("button", { name: "Update" }).click();

      await expect(page).toHaveURL(/\/settings\/product\/[0-9a-fA-F-]{36}$/);

      await expect(page.getByText("Back to list")).toBeVisible();
      const updatedToast = page.getByText("Product updated successfully");
      await expect(updatedToast).toBeVisible();
      await expect(updatedToast).toBeHidden();

      // Revert status to active
      await page.getByRole("button", { name: "Edit" }).click();
      await page.getByLabel("Status").click();
      await page.getByRole("option", { name: "Active", exact: true }).click();
      await page.getByRole("button", { name: "Update" }).click();

      await expect(updatedToast).toBeVisible();
      await page.getByRole("button", { name: "Edit" }).click();
      await expect(page.getByLabel("Status")).toHaveText("Active");
    },
  );
});
