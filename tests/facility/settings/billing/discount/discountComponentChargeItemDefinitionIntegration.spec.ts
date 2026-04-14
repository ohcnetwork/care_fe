import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

const CHARGE_ITEM_CATEGORY_NAME = "Medications";

test.describe("Discount Component & Charge Item Definition Integration", () => {
  let facilityId: string;
  let discountComponentName: string;
  let selectedDiscountLabel: string | undefined;
  let chargeItemTitle: string;
  let chargeItemSlug: string;
  let basePrice: string;
  let categoryName: string;
  let discountValue: string;
  let discountMinAge: string;
  let discountMaxAge: string;
  let discountConfigSnapshot: DiscountConfigSnapshot | undefined;

  interface DiscountConfigSnapshot {
    maxApplicableDiscounts: string;
    applicabilityOrderLabel: string;
  }
  async function ensureDiscountConfiguration(page: Page) {
    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_configuration`,
    );
    await page.waitForLoadState("networkidle");

    // Enter edit mode
    const editButton = page.getByRole("button", { name: /edit/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Snapshot current values from the form controls so we can restore them in afterEach
    const snapshotMaxApplicableInput = page.getByLabel(
      /maximum applicable discounts/i,
    );
    await expect(snapshotMaxApplicableInput).toBeVisible();
    const previousMaxApplicableDiscounts = (
      (await snapshotMaxApplicableInput.inputValue()) ?? ""
    ).trim();

    const snapshotApplicabilityOrderTrigger =
      page.getByLabel(/applicability order/i);
    await expect(snapshotApplicabilityOrderTrigger).toBeVisible();
    const previousApplicabilityOrderLabel = (
      (await snapshotApplicabilityOrderTrigger.textContent()) ?? ""
    ).trim();

    discountConfigSnapshot = {
      maxApplicableDiscounts: previousMaxApplicableDiscounts,
      applicabilityOrderLabel: previousApplicabilityOrderLabel,
    };

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

  async function restoreDiscountConfiguration(page: Page) {
    if (!discountConfigSnapshot) return;

    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_configuration`,
    );
    await page.waitForLoadState("networkidle");

    const editButton = page.getByRole("button", { name: /edit/i });
    await expect(editButton).toBeVisible();
    await editButton.click();

    const maxApplicableInput = page.getByLabel(/maximum applicable discounts/i);
    await expect(maxApplicableInput).toBeVisible();
    await maxApplicableInput.fill(
      discountConfigSnapshot.maxApplicableDiscounts,
    );

    // Restore applicability order only if we could reliably snapshot it.
    const applicabilityOrderTrigger = page.getByLabel(/applicability order/i);
    await expect(applicabilityOrderTrigger).toBeVisible();

    const label = discountConfigSnapshot.applicabilityOrderLabel.trim();
    if (label) {
      await applicabilityOrderTrigger.click();
      await page.getByRole("option", { name: label }).click();
    }

    const saveButton = page.getByRole("button", { name: /save/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await page.waitForLoadState("networkidle");
  }

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await ensureDiscountConfiguration(page);

    categoryName = CHARGE_ITEM_CATEGORY_NAME;

    // Generate unique names per test run to avoid collisions.
    // Keep as a single word to avoid UI/search edge cases around whitespace.
    discountComponentName = faker.word.noun();
    discountValue = faker.number.int({ min: 1, max: 99 }).toString();
    const minAge = faker.number.int({ min: 1, max: 90 });
    const maxAge = faker.number.int({ min: minAge + 1, max: 120 });
    discountMinAge = minAge.toString();
    discountMaxAge = maxAge.toString();

    const chargeItemName = faker.commerce.productName();
    chargeItemTitle = chargeItemName;
    const rawSlug = `test-${chargeItemName.toLowerCase()}`;
    chargeItemSlug =
      rawSlug
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9_-]/g, "") // allow underscore
        .replace(/^[-_]+|[-_]+$/g, "") // must start/end with alphanumeric
        .slice(0, 25)
        .replace(/^[-_]+|[-_]+$/g, "") || "test-slug";
    basePrice = faker.commerce.price({ dec: 0 });

    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /create discount component/i }),
    ).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    await restoreDiscountConfiguration(page);
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

    const amountInput = dialog.locator('input[name="amount"]');
    const factorInput = dialog.locator('input[name="factor"]');
    const discountValueInput =
      (await amountInput.count()) > 0 ? amountInput : factorInput;

    await expect(discountValueInput).toBeVisible();
    await discountValueInput.fill(discountValue);

    const discountCodeCombobox = dialog
      .getByText(/discount code/i)
      .locator("..")
      .locator("..")
      .getByRole("combobox")
      .last();
    await expect(discountCodeCombobox).toBeVisible();
    await discountCodeCombobox.click();
    const codeOptions = page.getByRole("option");
    const preferredCodeOption = codeOptions
      .filter({ hasText: /general/i })
      .first();
    const fallbackCodeOption = codeOptions
      .filter({ hasText: /default/i })
      .first();

    if (await preferredCodeOption.isVisible()) {
      await preferredCodeOption.click();
    } else if (await fallbackCodeOption.isVisible()) {
      await fallbackCodeOption.click();
    } else {
      const firstCodeOption = codeOptions.first();
      await expect(firstCodeOption).toBeVisible();
      await firstCodeOption.click();
    }

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

      await dialog.getByPlaceholder("Min").fill(discountMinAge);
      await dialog.getByPlaceholder("Max").fill(discountMaxAge);
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
    // Search matches by component title or code.code; code is the most reliable.
    await searchInput.fill(discountComponentName);

    // The selector is a Radix popover; scope to the portal content that contains the search box.
    const scope = page
      .locator("[data-radix-popper-content-wrapper]")
      .filter({ has: searchInput })
      .first();
    await expect(scope).toBeVisible();

    const componentOption = scope.getByRole("radio").first();
    await expect(componentOption).toBeVisible();
    await componentOption.click();

    selectedDiscountLabel =
      (await componentOption.getAttribute("aria-label"))?.trim() ??
      discountValue;

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
      page.getByText(/charge item definition created successfully/i),
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
    await page.getByPlaceholder("Min").fill(discountMinAge);
    await page.getByPlaceholder("Max").fill(discountMaxAge);
    await page.getByRole("button", { name: /^add$/i }).click();

    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition created successfully/i),
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
      page.getByText(
        `Patient Age is in range ${discountMinAge} to ${discountMaxAge} years`,
      ),
    ).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).click();
    await expect(
      page.getByText(
        `Patient Age is in range ${discountMinAge} to ${discountMaxAge} years`,
      ),
    ).toBeVisible();
  });
});
