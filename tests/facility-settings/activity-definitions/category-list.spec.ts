import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import {
  ResourceCategoryRead,
  ResourceCategoryResourceType,
} from "@/src/types/base/resourceCategory/resourceCategory";
import type { FacilityRead } from "@/src/types/facility/facility";
import { createResourceCategory, loadFacility } from "@/tests/helpers/helpers";

interface TestSetup {
  facility: FacilityRead;
}

test.use({ storageState: "tests/.auth/user.json" });

function generateCategoryData() {
  return {
    name: `${faker.lorem.word()}_${faker.string.uuid().slice(0, 8)}`,
    description: faker.lorem.sentence(),
  };
}

let setup: TestSetup;

test.beforeAll(async () => {
  const facility = loadFacility();
  setup = { facility };
});

test.describe("category list", () => {
  test("should load page and verify initial state", async ({ page }) => {
    await page.goto(
      `/facility/${setup.facility.id}/settings/activity_definitions`,
    );

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
    const testData = generateCategoryData();

    await page.goto(
      `/facility/${setup.facility.id}/settings/activity_definitions`,
    );

    await page.getByRole("button", { name: /add category/i }).click();

    const dialog = page.getByRole("dialog", { name: /create category/i });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await dialog.getByRole("textbox", { name: /^name$/i }).fill(testData.name);

    await dialog
      .getByRole("textbox", { name: /^description$/i })
      .fill(testData.description);

    await dialog.getByRole("combobox", { name: /resource sub type/i }).click();
    await page.getByRole("option", { name: /^other$/i }).click();

    await dialog.getByRole("button", { name: /^create category$/i }).click();

    await expect(
      page.getByText(/category created successfully/i),
    ).toBeVisible();

    await expect(page).toHaveURL(
      new RegExp(
        `/facility/${setup.facility.id}/settings/activity_definitions/categories/f-${setup.facility.id}-.*`,
      ),
    );

    await expect(page.getByText(testData.name)).toBeVisible();
  });

  test.describe("with existing category", () => {
    let testCategory: ResourceCategoryRead;

    test.beforeAll(async () => {
      const categoryData = generateCategoryData();

      testCategory = await createResourceCategory(setup.facility.id, {
        name: categoryData.name,
        description: categoryData.description,
        resourceType: ResourceCategoryResourceType.activity_definition,
      });
    });

    test("should search for category", async ({ page }) => {
      await page.goto(
        `/facility/${setup.facility.id}/settings/activity_definitions`,
      );

      const searchInput = page.getByPlaceholder(/search categories/i);
      await expect(searchInput).toBeVisible();

      await searchInput.fill(testCategory.title);

      await expect(page.getByText(testCategory.title)).toBeVisible();
    });

    test("should navigate into category", async ({ page }) => {
      await page.goto(
        `/facility/${setup.facility.id}/settings/activity_definitions`,
      );

      await page.getByRole("heading", { name: testCategory.title }).click();

      await expect(page).toHaveURL(
        `/facility/${setup.facility.id}/settings/activity_definitions/categories/${testCategory.slug}`,
      );

      await expect(
        page.getByRole("heading", { name: /activity definition/i }),
      ).toBeVisible();

      const addActivityButton = page.getByRole("button", {
        name: /add activity definition/i,
      });
      await expect(addActivityButton).toBeVisible();
      await expect(addActivityButton).toBeEnabled();
    });

    test("should edit category", async ({ page }) => {
      const updatedData = generateCategoryData();

      await page.goto(
        `/facility/${setup.facility.id}/settings/activity_definitions`,
      );

      const categoryCard = page
        .locator('[class*="cursor-pointer"]')
        .filter({ hasText: testCategory.title });

      await expect(categoryCard).toBeVisible();

      const editButton = categoryCard.getByRole("button").last();
      await editButton.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("heading", { name: /edit category/i }),
      ).toBeVisible();

      const nameInput = dialog.getByRole("textbox", { name: /^name$/i });
      await nameInput.clear();
      await nameInput.fill(updatedData.name);

      const descriptionInput = dialog.getByRole("textbox", {
        name: /^description$/i,
      });
      await descriptionInput.clear();
      await descriptionInput.fill(updatedData.description);

      await dialog.getByRole("button", { name: /^update category$/i }).click();

      await expect(
        page.getByText(/category updated successfully/i),
      ).toBeVisible();

      await expect(page.getByText(updatedData.name)).toBeVisible();
    });
  });
});
