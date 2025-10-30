import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { expectToast } from "@/tests/helpers/ui";
import { getFacilityId } from "@/tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

function generateCategoryData() {
  return {
    name: `${faker.lorem.word()} ${faker.string.uuid().slice(0, 8)}`,
    description: faker.lorem.sentence(),
    slug: `${faker.lorem.word()}-${faker.string.uuid().slice(0, 8)}`,
  };
}

let testData: ReturnType<typeof generateCategoryData>;
let facilityId: string;

test.beforeAll(() => {
  testData = generateCategoryData();
  facilityId = getFacilityId();
});

test.describe("category list", () => {
  test.describe.configure({ mode: "serial" });

  test("should load page and verify initial state", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    await expect(
      page.getByRole("heading", { name: /activity definition/i }),
    ).toBeVisible();

    const addCategoryButton = page.getByRole("button", {
      name: /add category/i,
    });
    await expect(addCategoryButton).toBeVisible();
    await expect(addCategoryButton).toBeEnabled();

    const addActivityButton = page.getByRole("button", {
      name: /add activity definition/i,
    });
    await expect(addActivityButton).toBeVisible();
    await expect(addActivityButton).toBeDisabled();
  });

  test("should create category and navigate to it", async ({ page }) => {
    await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

    await page.getByRole("button", { name: /add category/i }).click();

    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await sheet.getByLabel(/^name$/i).fill(testData.name);

    await sheet.getByLabel(/^slug$/i).fill(testData.slug);

    await sheet.getByLabel(/^description$/i).fill(testData.description);

    await sheet.getByLabel(/resource sub type/i).click();
    await page.getByRole("option", { name: /^other$/i }).click();

    await sheet.getByRole("button", { name: /^create category$/i }).click();

    await expectToast(page, /category created successfully/i);

    await expect(page).toHaveURL(
      new RegExp(
        `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${testData.slug}`,
      ),
    );

    await expect(page.getByText(testData.name)).toBeVisible();
  });

  test.describe("with existing category", () => {
    test("should search for category", async ({ page }) => {
      await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

      const searchInput = page.getByPlaceholder(/search categories/i);
      await expect(searchInput).toBeVisible();

      await searchInput.fill(testData.name);

      await expect(page.getByText(testData.name)).toBeVisible();
    });

    test("should navigate into category", async ({ page }) => {
      await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

      await expect(page.getByText(testData.name)).toBeVisible();

      await page.getByRole("heading", { name: testData.name }).click();

      await expect(page).toHaveURL(
        new RegExp(
          `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${testData.slug}`,
        ),
      );

      await expect(
        page.getByRole("heading", { name: /activity definition/i }),
      ).toBeVisible();

      await expect(page.getByText(testData.name)).toBeVisible();

      const addActivityButton = page.getByRole("button", {
        name: /add activity definition/i,
      });
      await expect(addActivityButton).toBeVisible();
      await expect(addActivityButton).toBeEnabled();
    });

    test("should create nested category inside existing category", async ({
      page,
    }) => {
      const childCategoryData = generateCategoryData();
      console.log(testData.name);

      await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

      await expect(page.getByText(testData.name)).toBeVisible();

      await page.getByRole("heading", { name: testData.name }).click();

      await expect(page).toHaveURL(
        new RegExp(
          `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${testData.slug}`,
        ),
      );

      const addCategoryButton = page.getByRole("button", {
        name: /add category/i,
      });
      await expect(addCategoryButton).toBeVisible();
      await addCategoryButton.click();

      const sheet = page.locator('[data-slot="sheet-content"]');
      await expect(sheet).toBeVisible();
      await expect(
        sheet.getByRole("heading", { name: /create category/i }),
      ).toBeVisible();

      await sheet.getByLabel(/^name$/i).fill(childCategoryData.name);

      await sheet
        .getByLabel(/^description$/i)
        .fill(childCategoryData.description);

      await sheet.getByRole("button", { name: /^create category$/i }).click();

      await expectToast(page, /category created successfully/i);

      await expect(page.getByText(childCategoryData.name)).toBeVisible();

      await expect(page.getByText(testData.name)).toBeVisible();
    });

    test("should edit category", async ({ page }) => {
      const updatedData = generateCategoryData();

      await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

      await expect(page.getByText(testData.name)).toBeVisible();

      const categoryCard = page.locator('[data-slot="card"]').filter({
        has: page.getByRole("heading", { name: testData.name }),
      });
      const editButton = categoryCard.locator('[data-slot="button"]');
      await editButton.click();

      const sheet = page.locator('[data-slot="sheet-content"]');
      await expect(sheet).toBeVisible();
      await expect(
        sheet.getByRole("heading", { name: /edit category/i }),
      ).toBeVisible();

      await sheet.getByLabel(/^name$/i).clear();
      await sheet.getByLabel(/^name$/i).fill(updatedData.name);

      await sheet.getByLabel(/^description$/i).clear();
      await sheet.getByLabel(/^description$/i).fill(updatedData.description);

      await sheet.getByRole("button", { name: /^update category$/i }).click();

      await expectToast(page, /category updated successfully/i);

      await expect(page.getByText(updatedData.name)).toBeVisible();
    });
  });
});
