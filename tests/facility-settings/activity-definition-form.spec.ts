import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { getFacilityAndCategory, type FacilitySetup } from "@/tests/helpers";

test.use({ storageState: "tests/.auth/user.json" });

function generateActivityDefinitionData() {
  return {
    title: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    usage: faker.lorem.sentences(2),
  };
}

let setup: FacilitySetup;

test.beforeAll(async () => {
  setup = await getFacilityAndCategory();
});

test.describe("Activity Definition Form", () => {
  test("should load the form and display page content", async ({ page }) => {
    await page.goto(
      `/facility/${setup.facilityId}/settings/activity_definitions/categories/${setup.resourceCategory.slug}/new`,
    );

    await page.waitForLoadState("networkidle", { timeout: 30000 });

    await expect(
      page.getByRole("heading", { name: /create activity definition/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /basic information/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /additional details/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /requirements/i }),
    ).toBeVisible();

    await expect(page.getByLabel(/title.*\*/i)).toBeVisible();
    await expect(page.getByLabel(/slug.*\*/i)).toBeVisible();
    await expect(page.getByLabel(/description.*\*/i)).toBeVisible();
    await expect(page.getByLabel(/usage.*\*/i)).toBeVisible();

    await expect(page.getByLabel(/^status$/i)).toBeVisible();
    await expect(page.getByLabel(/^kind$/i)).toBeVisible();

    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible();
  });

  test("should fill form with required fields and submit", async ({ page }) => {
    const testData = generateActivityDefinitionData();

    await page.goto(
      `/facility/${setup.facilityId}/settings/activity_definitions/categories/${setup.resourceCategory.slug}/new`,
    );

    await page.waitForLoadState("networkidle", { timeout: 30000 });

    await expect(
      page.getByRole("heading", { name: /create activity definition/i }),
    ).toBeVisible();

    await page.getByLabel(/title.*\*/i).fill(testData.title);
    await page.getByLabel(/description.*\*/i).fill(testData.description);
    await page.getByLabel(/usage.*\*/i).fill(testData.usage);

    await page.getByLabel(/^status$/i).click();
    await page.getByRole("option", { name: /active/i }).click();

    await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
    await page.getByRole("option").first().click();

    await expect(page.getByText(setup.resourceCategory.title)).toBeVisible();

    await page.getByLabel(/^kind$/i).click();
    await page.getByRole("option", { name: /service request/i }).click();

    const codeCombobox = page.getByRole("combobox", { name: /^code/i });
    await codeCombobox.click();

    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });

    const searchInput = dialog.getByPlaceholder(/search for activity codes/i);
    await searchInput.waitFor({ state: "visible" });

    await searchInput.fill("procedure");

    const listbox = dialog.getByRole("listbox", { name: /suggestions/i });
    await listbox.waitFor({ state: "visible" });

    const firstOption = dialog.getByRole("option").first();
    await firstOption.waitFor({ state: "visible" });
    await firstOption.click();

    await page.getByRole("button", { name: /^create$/i }).click();

    await expect(
      page.getByText(/activity definition created successfully/i),
    ).toBeVisible({ timeout: 15000 });

    await expect(page).toHaveURL(
      `/facility/${setup.facilityId}/settings/activity_definitions`,
    );
  });
});
