import { expect, test } from "@playwright/test";

import { getFacilityId } from "@/tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let categorySlug: string;

test.beforeAll(() => {
  facilityId = getFacilityId();
  categorySlug = `f-${facilityId}-lab-tests-activity_definition`;
});

test.describe("activity definition list", () => {
  test("should display activity definitions list with correct initial state", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    await expect(
      page.locator('[data-slot="breadcrumb-link"]').filter({
        hasText: /activity definition/i,
      }),
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="breadcrumb-page"]').filter({
        hasText: /lab tests/i,
      }),
    ).toBeVisible();

    await expect(
      page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /status/i })
        .filter({ hasText: /active/i }),
    ).toBeVisible();

    const tableRows = page.locator(
      '[data-slot="table-body"] [data-slot="table-row"]',
    );
    await expect(tableRows).toHaveCount(4);

    await expect(
      page.getByText(/showing 4 of 4 activity definitions/i),
    ).toBeVisible();

    await page.getByRole("link", { name: /view/i }).first().click();

    await expect(page).toHaveURL(
      new RegExp(`/facility/${facilityId}/settings/activity_definitions/.*`),
    );

    await page.getByRole("button", { name: /back/i }).click();

    await expect(page).toHaveURL(
      new RegExp(
        `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
      ),
    );

    await page.getByRole("link", { name: /edit/i }).first().click();

    await expect(page).toHaveURL(
      new RegExp(
        `/facility/${facilityId}/settings/activity_definitions/.*/edit`,
      ),
    );
  });

  test("should filter activity definitions by search", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    const searchInput = page.getByPlaceholder(/search activity definitions/i);
    await searchInput.fill("Lipid Panel");

    const tableRows = page.locator(
      '[data-slot="table-body"] [data-slot="table-row"]',
    );
    await expect(tableRows).toHaveCount(1);
    await expect(tableRows.filter({ hasText: "Lipid Panel" })).toBeVisible();

    await expect(
      page.getByText(/showing 1 of 1 activity definitions/i),
    ).toBeVisible();
  });

  test("should filter by status and clear filter", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    const statusFilterTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /status/i });
    await statusFilterTrigger.click();
    await page.getByRole("option", { name: /draft/i }).click();

    await expect(
      page.getByText(/no activity definitions found/i),
    ).toBeVisible();

    const clearButton = page
      .getByRole("button")
      .filter({ has: page.locator("svg.lucide-x") })
      .first();
    await clearButton.click();

    const tableRows = page.locator(
      '[data-slot="table-body"] [data-slot="table-row"]',
    );
    await expect(tableRows).toHaveCount(4);

    // Then verify count text
    await expect(
      page.getByText(/showing 4 of 4 activity definitions/i),
    ).toBeVisible();
  });

  test("should filter by category/classification and change filters", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    const categoryFilterTrigger = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /category/i });
    await categoryFilterTrigger.click();
    await page.getByRole("option", { name: /imaging/i }).click();

    await expect(
      page.getByText(/no activity definitions found/i),
    ).toBeVisible();

    const categoryFilterTriggerAgain = page
      .locator('[data-slot="select-trigger"]')
      .filter({ hasText: /imaging/i });
    await categoryFilterTriggerAgain.click();
    await page.getByRole("option", { name: /laboratory/i }).click();

    const tableRows = page.locator(
      '[data-slot="table-body"] [data-slot="table-row"]',
    );
    await expect(tableRows).toHaveCount(4);

    await expect(
      page.getByText(/showing 4 of 4 activity definitions/i),
    ).toBeVisible();
  });
});
