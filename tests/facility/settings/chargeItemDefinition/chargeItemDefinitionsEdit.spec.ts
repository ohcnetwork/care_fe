import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
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

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    title = faker.commerce.productName();
    basePrice = faker.commerce.price({ dec: 0 });
    mrp = faker.commerce.price({ dec: 0 });
    purchasePrice = faker.commerce.price({ dec: 0 });
    description = faker.commerce.productDescription();
    purpose = faker.commerce.productAdjective();
    url = faker.internet.url();
    categoryName = "Medications";

    await page.goto(
      `/facility/${facilityId}/settings/charge_item_definitions/`,
    );
    await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
  });

  test("edit charge item definition", async ({ page }) => {
    await page.getByRole("link", { name: "Edit" }).first().click();
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

    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    await page
      .getByRole("textbox", { name: /Search/i })
      .fill(title + " - edited");
    await expect(
      page.getByRole("table").getByText(title + " - edited"),
    ).toBeVisible();
  });
});
