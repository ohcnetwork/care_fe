import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  RESOURCE_CATEGORY_NAME,
  RESOURCE_CATEGORY_SLUG,
} from "tests/facility/settings/activityDefinition/activityDefinition";
import { getFieldErrorMessage } from "tests/helper/error";
import { expectToast } from "tests/helper/ui";
import { expectedSlug } from "tests/helper/utils";
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
  const title = faker.string.alpha({ length: { min: 5, max: 20 } });
  return {
    title,
    slug: expectedSlug(title),
    description: faker.lorem.sentence(),
  };
}

test.describe("Activity Definition Resource Category List", () => {
  test("should show validation errors when trying to create without required fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /create category/i }).click();

    await expect(
      getFieldErrorMessage(page.getByPlaceholder(/enter category title/i)),
    ).toContainText(/required/i);

    const slugInput = page.getByPlaceholder(/enter category slug/i);
    await expect(getFieldErrorMessage(slugInput)).toContainText(
      /atleast 5.*atmost 25/i,
    );

    await slugInput.click();
    await slugInput.fill("abc");
    await expect(getFieldErrorMessage(slugInput)).toContainText(
      /atleast 5.*atmost 25/i,
    );
  });

  test("should create category with required fields only", async ({ page }) => {
    const testData = generateCategoryData();

    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByLabel(/name/i).fill(testData.title);

    await expect(page.getByLabel(/slug/i)).toHaveValue(
      expectedSlug(testData.title),
    );

    await page.getByRole("button", { name: /create category/i }).click();

    await expectToast(page, /category created successfully/i);

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).not.toBeVisible();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${testData.slug}`,
    );

    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    await expect(page.getByText(testData.title)).toBeVisible();
  });

  test("should create category with all the fields", async ({ page }) => {
    const testData = generateCategoryData();

    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByLabel(/name/i).fill(testData.title);

    await expect(page.getByLabel(/slug/i)).toHaveValue(
      expectedSlug(testData.title),
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
      `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${testData.slug}`,
    );

    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    await expect(page.getByText(testData.title)).toBeVisible();
  });

  test("should cancel category creation and close form when clicking on cancel button", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /cancel/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).not.toBeVisible();
  });

  test("should edit category", async ({ page }) => {
    const testData = generateCategoryData();

    await page.getByRole("button", { name: /add category/i }).click();

    await page.getByLabel(/name/i).fill(testData.title);
    await page.getByRole("button", { name: /create category/i }).click();

    await expectToast(page, /category created successfully/i);

    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: testData.title })
      .getByRole("button")
      .click();

    const updatedData = generateCategoryData();
    await page.getByLabel(/name/i).clear();
    await page.getByLabel(/name/i).fill(updatedData.title);
    await page.getByLabel(/description/i).clear();
    await page.getByLabel(/description/i).fill(updatedData.description);

    await page.getByRole("button", { name: /update category/i }).click();

    await expectToast(page, /category updated successfully/i);

    await expect(
      page.getByRole("heading", { name: /edit category/i }),
    ).not.toBeVisible();

    await expect(page.getByText(updatedData.title)).toBeVisible();
    await expect(page.getByText(testData.title)).not.toBeVisible();
  });

  test("should navigate to activity definitions list when clicking on category card", async ({
    page,
  }) => {
    const categoryCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.locator("h3", { hasText: RESOURCE_CATEGORY_NAME }) });
    await categoryCard.click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${RESOURCE_CATEGORY_SLUG}`,
    );
  });

  test("should show existing category when searching", async ({ page }) => {
    const testData = generateCategoryData();

    await page.getByRole("button", { name: /add category/i }).click();

    await expect(
      page.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await page.getByLabel(/name/i).fill(testData.title);

    await expect(page.getByLabel(/slug/i)).toHaveValue(
      expectedSlug(testData.title),
    );

    await page.getByRole("button", { name: /create category/i }).click();

    await expectToast(page, /category created successfully/i);

    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill(testData.title);

    await expect(page.getByText(testData.title)).toBeVisible();

    await searchInput.clear();
    await searchInput.fill(faker.string.uuid());

    await expect(page.getByText(testData.title)).not.toBeVisible();

    await searchInput.clear();

    await expect(page.getByText(testData.title)).toBeVisible();
  });

  test("should show no results message when searching for non-existent category", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    await page.getByPlaceholder(/search/i).fill(faker.string.alphanumeric(10));

    await expect(page.getByText(/no results/i)).toBeVisible();
  });
});
