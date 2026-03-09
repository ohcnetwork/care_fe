import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Discount Component Settings", () => {
  let facilityId: string;
  let componentName: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    componentName = faker.commerce.productName();

    await page.goto(
      `/facility/${facilityId}/settings/billing/discount_components`,
    );

    await expect(
      page.getByRole("button", { name: /create discount component/i }),
    ).toBeVisible();
  });

  test("validate required fields", async ({ page }) => {
    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    const nameInput = page.getByRole("textbox", { name: /name/i });
    const saveButton = page.getByRole("button", { name: /save/i });

    await nameInput.fill("temp");
    await nameInput.fill("");

    await saveButton.click();

    await expect(page.getByText(/this field is required/i)).toBeVisible();
    await expect(
      page.getByText(/either amount or factor is required/i),
    ).toBeVisible();
  });

  test("create discount component and search", async ({ page }) => {
    const discountValue = "100";

    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    await page.getByRole("textbox", { name: /name/i }).fill(componentName);

    await page
      .getByRole("spinbutton", { name: /discount amount or factor/i })
      .fill(discountValue);

    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(/discount component created/i)).toBeVisible();

    const table = page.getByRole("table");
    await expect(table.getByText(componentName)).toBeVisible();

    const searchInput = page.getByRole("textbox", { name: /search/i });

    await searchInput.fill(componentName);
    await expect(table.getByText(componentName)).toBeVisible();

    const nonMatchingQuery = faker.string.alphanumeric(10);
    await searchInput.fill(nonMatchingQuery);

    await expect(
      page.getByText(/no discount components matches this search/i),
    ).toBeVisible();
    await expect(table.getByText(componentName)).toHaveCount(0);
  });

  test("create discount component with condition", async ({ page }) => {
    const discountValue = "5";

    await page
      .getByRole("button", { name: /create discount component/i })
      .click();

    await page
      .getByRole("textbox", { name: /name/i })
      .fill(`${componentName} with condition`);

    await page
      .getByRole("spinbutton", { name: /discount amount or factor/i })
      .fill(discountValue);

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

    await page.getByRole("button", { name: /save/i }).click();

    await expect(page.getByText(/discount component created/i)).toBeVisible();

    await expect(
      page.getByRole("table").getByText(`${componentName} with condition`),
    ).toBeVisible();
  });
});
