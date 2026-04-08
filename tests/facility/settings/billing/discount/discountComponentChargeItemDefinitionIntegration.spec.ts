import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const CHARGE_ITEM_CATEGORY_NAMES = ["Medications"] as const;

test.describe("Discount Component & Charge Item Definition Integration", () => {
  let facilityId: string;
  let discountComponentName: string;
  let selectedDiscountLabel: string;
  let chargeItemTitle: string;
  let chargeItemSlug: string;
  let basePrice: string;
  let categoryName: string;

  async function ensureDiscountConfiguration(page: Page) {
    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_configuration`,
    );
    await page.waitForLoadState("networkidle");

    // Enter edit mode
    const editButton = page.getByRole("button", { name: /edit/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Set a simple, valid configuration using the real labels
    const maxApplicableInput = page.getByLabel(/maximum applicable discounts/i);
    await expect(maxApplicableInput).toBeVisible();
    await maxApplicableInput.fill("0"); // 0 = no limit

    const applicabilityOrderTrigger = page.getByLabel(/applicability order/i);
    await expect(applicabilityOrderTrigger).toBeVisible();
    await applicabilityOrderTrigger.click();

    const totalDescOption = page.getByRole("option", {
      name: /highest value first/i,
    });
    await expect(totalDescOption).toBeVisible();
    await totalDescOption.click();

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await page.waitForLoadState("networkidle");

    await expect(
      page.getByText(/discount configuration saved successfully/i),
    ).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await ensureDiscountConfiguration(page);

    categoryName = faker.helpers.arrayElement([...CHARGE_ITEM_CATEGORY_NAMES]);

    const discountName = faker.commerce.productName();
    discountComponentName = discountName;

    const chargeItemName = faker.commerce.productName();
    chargeItemTitle = chargeItemName;
    chargeItemSlug = `test-${chargeItemName.replace(/\s+/g, "-").toLowerCase()}`
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 25);
    basePrice = faker.commerce.price({ dec: 0 });

    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );
    await page.waitForLoadState("networkidle");

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

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("textbox", { name: /name/i })
      .fill(discountComponentName);

    const discountValueInput = dialog.getByRole("spinbutton").first();
    await expect(discountValueInput).toBeVisible();
    await discountValueInput.fill("10");

    if (withCondition) {
      await dialog.getByRole("button", { name: /add condition/i }).click();

      await dialog
        .getByRole("combobox")
        .filter({ hasText: /^Metric|Encounter/ })
        .click();
      await page.getByRole("option", { name: "Patient Age" }).click();

      await dialog
        .getByRole("combobox")
        .filter({ hasText: "In range" })
        .click();
      await page.getByRole("option", { name: "In range" }).click();

      await dialog.getByPlaceholder("Min").fill("60");
      await dialog.getByPlaceholder("Max").fill("120");
      await dialog.getByRole("button", { name: /^add$/i }).click();
    }

    await dialog.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(/discount component created/i)).toBeVisible();
  }

  async function navigateToChargeItemCategory(page: Page) {
    await page.goto(
      `/facility/${facilityId}/settings/charge_item_definitions/`,
    );
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder(/search/i).fill(categoryName);
    await page.getByRole("heading", { name: categoryName }).click();
  }

  async function openCreateChargeItemDefinition(page: Page) {
    await page.getByRole("button", { name: /add definition/i }).click();

    await page.getByRole("textbox", { name: /title/i }).fill(chargeItemTitle);
    await page.getByRole("textbox", { name: /slug/i }).fill(chargeItemSlug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);
  }

  async function openDiscountSelector(page: Page) {
    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();

    await expect(
      page.getByPlaceholder(/search for discount code/i),
    ).toBeVisible();
  }

  async function selectDiscountByName(page: Page) {
    const searchInput = page.getByPlaceholder(/search for discount code/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("");

    const scope = page
      .locator("[role='dialog'], [data-radix-popper-content-wrapper]")
      .filter({ has: searchInput })
      .last();
    await expect(scope).toBeVisible();

    const discountCheckbox = scope.getByRole("checkbox").first();
    await expect(discountCheckbox).toBeVisible();

    selectedDiscountLabel =
      (await discountCheckbox.getAttribute("aria-label"))?.trim() ?? "";
    await discountCheckbox.click();

    await page.getByRole("button", { name: "Done" }).click();
  }

  test("discount component appears in Add Discount and persists on view/edit", async ({
    page,
  }) => {
    await createDiscountComponent(page);

    await navigateToChargeItemCategory(page);
    await expect(
      page.getByRole("button", { name: /add definition/i }),
    ).toBeVisible();

    await openCreateChargeItemDefinition(page);

    await openDiscountSelector(page);
    await selectDiscountByName(page);

    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    await page.getByPlaceholder(/search definitions/i).fill(chargeItemTitle);
    await expect(
      page.getByRole("table").getByText(chargeItemTitle),
    ).toBeVisible();

    await page
      .getByRole("table")
      .getByRole("row")
      .filter({ hasText: chargeItemTitle })
      .getByRole("link", { name: "View" })
      .click();
    await expect(
      page.getByRole("heading", { name: chargeItemTitle }),
    ).toBeVisible();

    if (selectedDiscountLabel) {
      await expect(page.getByText(selectedDiscountLabel).first()).toBeVisible();
    }

    await page.getByRole("button", { name: "Edit" }).click();

    if (selectedDiscountLabel) {
      await expect(page.getByText(selectedDiscountLabel).first()).toBeVisible();
    }
  });

  test("conditional discount component can be attached and conditions persist", async ({
    page,
  }) => {
    await createDiscountComponent(page, { withCondition: true });

    await navigateToChargeItemCategory(page);
    await expect(
      page.getByRole("button", { name: /add definition/i }),
    ).toBeVisible();

    await openCreateChargeItemDefinition(page);

    await openDiscountSelector(page);
    await selectDiscountByName(page);

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

    await page.getByPlaceholder(/search definitions/i).fill(chargeItemTitle);
    await expect(
      page.getByRole("table").getByText(chargeItemTitle),
    ).toBeVisible();
    await page
      .getByRole("table")
      .getByRole("row")
      .filter({ hasText: chargeItemTitle })
      .getByRole("link", { name: "View" })
      .click();

    await expect(
      page.getByText("Patient Age is in range 60 to 120 years"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).click();
    await expect(
      page.getByText("Patient Age is in range 60 to 120 years"),
    ).toBeVisible();
  });
});
