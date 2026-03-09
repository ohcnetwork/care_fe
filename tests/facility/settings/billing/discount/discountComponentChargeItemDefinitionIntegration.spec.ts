import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Component & Charge Item Definition Integration", () => {
  let facilityId: string;
  let discountComponentName: string;
  let chargeItemTitle: string;
  let chargeItemSlug: string;
  let basePrice: string;
  const categoryName = "Medications";

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();

    const discountName = faker.commerce.productName();
    discountComponentName = discountName;

    const chargeItemName = faker.commerce.productName();
    chargeItemTitle = chargeItemName;
    chargeItemSlug = chargeItemName.replace(/\s+/g, "-").slice(0, 25);
    basePrice = faker.commerce.price({ dec: 0 });

    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );

    await expect(
      page.getByRole("button", { name: /create discount component/i }),
    ).toBeVisible();
  });

  async function createDiscountComponent(
    page: Page,
    options?: { withCondition?: boolean },
  ) {
    const withCondition = options?.withCondition ?? false;

    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    await page
      .getByRole("textbox", { name: /name/i })
      .fill(discountComponentName);

    await page
      .getByRole("spinbutton", { name: /discount amount or factor/i })
      .fill("10");

    if (withCondition) {
      await page.getByRole("button", { name: /add condition/i }).click();

      await page
        .getByRole("combobox")
        .filter({ hasText: /^Metric|Encounter/ })
        .click();
      await page.getByRole("option", { name: "Patient Age" }).click();

      await page.getByRole("combobox").filter({ hasText: "In range" }).click();
      await page.getByRole("option", { name: "In range" }).click();

      await page.getByPlaceholder("Min").fill("60");
      await page.getByPlaceholder("Max").fill("120");
      await page.getByRole("button", { name: /^add$/i }).click();
    }

    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(/discount component created/i)).toBeVisible();
  }

  async function navigateToChargeItemCategory(page: Page) {
    await page.goto(
      `/facility/${facilityId}/settings/charge_item_definitions/`,
    );
    await page.getByRole("textbox", { name: "Search" }).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
  }

  async function openCreateChargeItemDefinition(page: Page) {
    await page.getByRole("button", { name: /add definition/i }).click();

    await page.getByRole("textbox", { name: /title/i }).fill(chargeItemTitle);
    await page.getByRole("textbox", { name: /slug/i }).fill(chargeItemSlug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);
  }

  async function openDiscountSelectorAndFilter(page: Page) {
    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();

    const discountSearch = page.getByPlaceholder(/search for discount code/i);
    await discountSearch.fill(discountComponentName);
  }

  test("discount component appears in Add Discount and persists on view/edit", async ({
    page,
  }) => {
    await createDiscountComponent(page);

    await navigateToChargeItemCategory(page);
    await openCreateChargeItemDefinition(page);

    await openDiscountSelectorAndFilter(page);

    await page.getByRole("checkbox").first().click();
    await page.getByRole("button", { name: "Done" }).click();

    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    await page.getByRole("textbox", { name: /search/i }).fill(chargeItemTitle);
    await expect(
      page.getByRole("table").getByText(chargeItemTitle),
    ).toBeVisible();

    await page.getByRole("link", { name: "View" }).click();
    await expect(
      page.getByRole("heading", { name: chargeItemTitle }),
    ).toBeVisible();

    await expect(page.getByText(/discount/i)).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).click();

    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();

    await expect(page.getByText(/selected/i)).toBeVisible();
  });

  test("conditional discount component can be attached and conditions persist", async ({
    page,
  }) => {
    await createDiscountComponent(page, { withCondition: true });

    await navigateToChargeItemCategory(page);
    await openCreateChargeItemDefinition(page);

    await openDiscountSelectorAndFilter(page);

    await page.getByRole("checkbox").first().click();
    await page.getByRole("button", { name: "Done" }).click();

    const switchElement = page.getByRole("switch", {
      name: "Use facility global value",
    });
    if (await switchElement.isChecked()) {
      await switchElement.click();
    }

    await page.getByRole("button", { name: "Add Condition" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: /^Metric|Encounter/ })
      .click();
    await page.getByRole("option", { name: "Patient Age" }).click();
    await page.getByRole("combobox").filter({ hasText: "In range" }).click();
    await page.getByRole("option", { name: "In range" }).click();
    await page.getByPlaceholder("Min").fill("60");
    await page.getByPlaceholder("Max").fill("120");
    await page.getByRole("button", { name: /^add$/i }).click();

    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    await page.getByRole("textbox", { name: /search/i }).fill(chargeItemTitle);
    await expect(
      page.getByRole("table").getByText(chargeItemTitle),
    ).toBeVisible();
    await page.getByRole("link", { name: "View" }).click();

    await expect(
      page.getByText("Patient Age is in range 60 to 120 years"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).click();
    await expect(
      page.getByText("Patient Age is in range 60 to 120 years"),
    ).toBeVisible();
  });
});
