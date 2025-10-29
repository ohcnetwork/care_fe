import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

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

test.describe.serial("category list", () => {
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

    const dialog = page.getByRole("dialog", { name: /create category/i });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /create category/i }),
    ).toBeVisible();

    await dialog.getByRole("textbox", { name: /^name$/i }).fill(testData.name);

    await dialog.getByRole("textbox", { name: /^slug$/i }).fill(testData.slug);

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

    test("should edit category", async ({ page }) => {
      const updatedData = generateCategoryData();

      await page.goto(`/facility/${facilityId}/settings/activity_definitions`);

      await expect(page.getByText(testData.name)).toBeVisible();

      const categoryCard = page.locator('[data-slot="card"]').filter({
        has: page.getByRole("heading", { name: testData.name }),
      });
      const editButton = categoryCard.locator('[data-slot="button"]');
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
