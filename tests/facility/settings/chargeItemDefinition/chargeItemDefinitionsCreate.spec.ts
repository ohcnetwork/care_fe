import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Charge Item Definition Creation", () => {
  let facilityId: string;
  let title: string;
  let slug: string;
  let basePrice: string;
  let mrp: string;
  let purchasePrice: string;
  let description: string;
  let purpose: string;
  let url: string;
  let categoryName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const chargeItemName = faker.commerce.productName();
    title = chargeItemName;
    slug = chargeItemName.replace(/\s+/g, "-").slice(0, 25);
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

  test("validate required fields", async ({ page }) => {
    await page.getByRole("button", { name: /add definition/i }).click();
    await page.getByRole("button", { name: /create/i }).click();

    // Title required
    await expect(page.getByText(/title.*required/i)).toBeVisible();
    // Slug required/length
    await expect(page.getByText(/slug.*atleast 5.*atmost 25/i)).toBeVisible();
    // Base Price required/invalid
    await expect(page.getByText(/base price.*required/i)).toBeVisible();
  });

  test("create charge item definition with required fields only", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /add definition/i }).click();
    await page.getByRole("textbox", { name: /title/i }).fill(title);
    await page.getByRole("textbox", { name: /slug/i }).fill(slug);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);

    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    // Verify in edit view
    await page.getByRole("textbox", { name: /search/i }).fill(title);
    await expect(page.getByRole("table").getByText(title)).toBeVisible();

    await page.getByRole("link", { name: "View" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByRole("textbox", { name: /title/i })).toHaveValue(
      title,
    );
    await expect(page.getByRole("textbox", { name: /slug/i })).toHaveValue(
      slug.toLowerCase(),
    );
    await expect(
      page.getByRole("textbox", { name: /base price/i }),
    ).toHaveValue(Number(basePrice).toFixed(2));
  });

  test("create charge item definition with all fields", async ({ page }) => {
    const cgstRate = "9";
    const sgstRate = "6";
    await page.getByRole("button", { name: /add definition/i }).click();
    await page.getByRole("textbox", { name: /title/i }).fill(title);
    await page.getByRole("textbox", { name: /slug/i }).fill(slug);
    await page.getByRole("textbox", { name: /description/i }).fill(description);
    await page.getByRole("textbox", { name: /purpose/i }).fill(purpose);
    await page.getByRole("textbox", { name: /uri/i }).fill(url);
    await page.getByRole("textbox", { name: /base price/i }).fill(basePrice);
    await page.getByRole("textbox", { name: /mrp/i }).fill(mrp);
    await page
      .getByRole("textbox", { name: /purchase price/i })
      .fill(purchasePrice);

    await page
      .locator("div")
      .filter({ hasText: /^Add tax$/ })
      .first()
      .click();

    await page
      .getByRole("textbox", { name: "Search for tax code" })
      .fill(cgstRate);

    // Select 9% under CGST section - find exact "cgst" text, navigate to container, find radio button
    await page
      .getByText("cgst", { exact: true })
      .locator("../..")
      .locator(`button[role="radio"][value="${cgstRate}"]`)
      .click();

    await page
      .getByRole("textbox", { name: "Search for tax code" })
      .fill(sgstRate);

    // Select 6% under SGST section - find exact "sgst" text, navigate to container, find radio button
    await page
      .getByText("sgst", { exact: true })
      .locator("../..")
      .locator(`button[role="radio"][value="${sgstRate}"]`)
      .click();
    const doneButton = page.getByRole("button", { name: "Done" });
    await doneButton.scrollIntoViewIfNeeded();
    await doneButton.click();

    await page
      .locator("div")
      .filter({ hasText: /^Add Discount$/ })
      .first()
      .click();
    await page.getByRole("checkbox").first().click();
    await page.getByRole("button", { name: "Done" }).click();
    const switchElement = page.getByRole("switch", {
      name: "Use facility global value",
    });
    if (await switchElement.isChecked()) {
      await switchElement.click();
    }
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Add Condition" }).click();
    // To do: make this metric agnostic/otherwise might have to adjust everytime we add a new metric
    await page
      .getByRole("combobox")
      .filter({ hasText: /^Metric|Encounter/ })
      .click();
    await page.getByRole("option", { name: "Patient Age" }).click();
    await page.getByRole("combobox").filter({ hasText: "In range" }).click();
    await page.getByRole("option", { name: "In range" }).click();
    await page.getByPlaceholder("Min").fill("60");
    await page.getByPlaceholder("Max").fill("120");
    await page.getByRole("button", { name: "Add" }).click();

    await page.getByRole("button", { name: /create/i }).click();

    await expect(
      page.getByText(/charge item definition.*created successfully/i),
    ).toBeVisible();

    // Verify all fields
    await page.getByRole("textbox", { name: /search/i }).fill(title);
    await expect(page.getByRole("table").getByText(title)).toBeVisible();
    await page.getByRole("link", { name: "View" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.getByText(purpose).last()).toBeVisible();
    await expect(page.getByText(url)).toBeVisible();
    await expect(page.getByText(mrp)).toBeVisible();
    await expect(page.getByText(purchasePrice)).toBeVisible();
    await expect(page.getByText("9.00%")).toBeVisible();
    await expect(page.getByText("6.00%")).toBeVisible();
    await expect(
      page.getByText("Patient Age is in range 60 to 120 years"),
    ).toBeVisible();
  });
});
