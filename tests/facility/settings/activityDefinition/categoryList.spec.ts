import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { generateExpectedSlug } from "tests/helpers/activityDefinition";
import { expectToast } from "tests/helpers/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;

test.beforeAll(() => {
  facilityId = getFacilityId();
});

test.beforeEach(async ({ page }) => {
  await page.goto(`/facility/${facilityId}/settings/activity_definitions`);
});

function generateCategoryData() {
  return {
    title: `${faker.commerce.department().slice(0, 10)}_${faker.string.uuid().slice(0, 8)}`,
    description: faker.lorem.sentence(),
  };
}

test.describe("Resource Category Creation", () => {
  test("should validate required fields", async ({ page }) => {
    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    const createButton = page.getByRole("button", { name: /create category/i });
    await createButton.click();

    await expect(page.getByText(/required/i).first()).toBeVisible();

    await expect(page.getByText(/must be atleast 5.*atmost 25/i)).toBeVisible();
  });

  test("should create category with required fields only", async ({ page }) => {
    const testData = generateCategoryData();

    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByLabel(/name/i).fill(testData.title);

    await expect(page.getByLabel(/slug/i)).toHaveValue(
      generateExpectedSlug(testData.title),
    );

    await page.getByRole("button", { name: /create category/i }).click();

    await expectToast(page, /category created successfully/i);

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).not.toBeVisible();

    await expect(page).toHaveURL(
      new RegExp(
        `/facility/${facilityId}/settings/activity_definitions/categories/f-.*`,
      ),
    );

    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    await expect(page.getByText(testData.title)).toBeVisible();
  });

  test("should create category with all fields", async ({ page }) => {
    const testData = generateCategoryData();

    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByLabel(/name/i).fill(testData.title);

    await expect(page.getByLabel(/slug/i)).toHaveValue(
      generateExpectedSlug(testData.title),
    );

    await page.getByLabel(/description/i).fill(testData.description);

    await expect(
      page.locator('[data-slot="select-value"]').filter({ hasText: /other/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /create category/i }).click();

    await expectToast(page, /category created successfully/i);

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).not.toBeVisible();

    await expect(page).toHaveURL(
      new RegExp(
        `/facility/${facilityId}/settings/activity_definitions/categories/f-.*`,
      ),
    );

    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    await expect(page.getByText(testData.title)).toBeVisible();
  });

  test("should cancel category creation and close form", async ({ page }) => {
    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /cancel/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).not.toBeVisible();
  });

  test("should search for categories", async ({ page }) => {
    const testData = generateCategoryData();

    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByLabel(/name/i).fill(testData.title);

    await expect(page.getByLabel(/slug/i)).toHaveValue(
      generateExpectedSlug(testData.title),
    );

    await page.getByRole("button", { name: /create category/i }).click();

    await expectToast(page, /category created successfully/i);

    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    const searchInput = page.getByPlaceholder(/search categories/i);
    await searchInput.fill(testData.title);

    await expect(page.getByText(testData.title)).toBeVisible();

    await searchInput.clear();
    await searchInput.fill(faker.string.uuid());

    await expect(page.getByText(testData.title)).not.toBeVisible();

    await searchInput.clear();

    await expect(page.getByText(testData.title)).toBeVisible();
  });
});
