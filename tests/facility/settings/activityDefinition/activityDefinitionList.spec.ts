import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";

import {
  createActivityDefinition,
  RESOURCE_CATEGORY_NAME,
  RESOURCE_CATEGORY_SLUG,
} from "tests/facility/settings/activityDefinition/activityDefinition";
import {
  applyTableFilter,
  clearFilter,
  verifyTableBadges,
} from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let categorySlug: string;

test.beforeAll(() => {
  facilityId = getFacilityId();
  categorySlug = `f-${facilityId}-${RESOURCE_CATEGORY_SLUG}`;
});

/**
 * Convenience wrapper to filter and verify activity definition table content
 */
async function filterAndVerify(
  page: Page,
  filterType: "status" | "classification",
  filterValue: string,
  createdADTitle: string,
) {
  const url = `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`;
  const filterLabel = filterType === "status" ? /status/i : /category/i;
  await applyTableFilter(page, url, filterLabel, filterValue);
  await verifyTableBadges(page, filterValue, createdADTitle);
}

test.describe("Activity Definition List", () => {
  test.describe("Status Filter", () => {
    test("should filter activity definitions by draft status", async ({
      page,
    }) => {
      const draftAD = await createActivityDefinition(page, facilityId, false, {
        status: "Draft",
      });

      await filterAndVerify(page, "status", "Draft", draftAD.title);
    });

    test("should filter activity definitions by active status", async ({
      page,
    }) => {
      const activeAD = await createActivityDefinition(page, facilityId, false, {
        status: "Active",
      });

      await filterAndVerify(page, "status", "Active", activeAD.title);
    });

    test("should filter activity definitions by retired status", async ({
      page,
    }) => {
      const retiredAD = await createActivityDefinition(
        page,
        facilityId,
        false,
        {
          status: "Retired",
        },
      );

      await filterAndVerify(page, "status", "Retired", retiredAD.title);
    });

    test("should filter activity definitions by unknown status", async ({
      page,
    }) => {
      const unknownAD = await createActivityDefinition(
        page,
        facilityId,
        false,
        {
          status: "Unknown",
        },
      );

      await filterAndVerify(page, "status", "Unknown", unknownAD.title);
    });
  });

  test.describe("Classification Filter", () => {
    test("should filter activity definitions by laboratory classification", async ({
      page,
    }) => {
      const laboratoryAD = await createActivityDefinition(
        page,
        facilityId,
        false,
        {
          classification: "Laboratory",
        },
      );

      await filterAndVerify(
        page,
        "classification",
        "Laboratory",
        laboratoryAD.title,
      );
    });

    test("should filter activity definitions by imaging classification", async ({
      page,
    }) => {
      const imagingAD = await createActivityDefinition(
        page,
        facilityId,
        false,
        {
          classification: "Imaging",
        },
      );

      await filterAndVerify(page, "classification", "Imaging", imagingAD.title);
    });

    test("should filter activity definitions by procedure classification", async ({
      page,
    }) => {
      const surgicalAD = await createActivityDefinition(
        page,
        facilityId,
        false,
        {
          classification: "Procedure",
        },
      );

      await filterAndVerify(
        page,
        "classification",
        "Procedure",
        surgicalAD.title,
      );
    });

    test("should filter activity definitions by counselling classification", async ({
      page,
    }) => {
      const counsellingAD = await createActivityDefinition(
        page,
        facilityId,
        false,
        {
          classification: "Counselling",
        },
      );

      await filterAndVerify(
        page,
        "classification",
        "Counselling",
        counsellingAD.title,
      );
    });
  });

  test("should verify row content and navigation to view and edit pages", async ({
    page,
  }) => {
    const testAD = await createActivityDefinition(page, facilityId, false, {
      status: "Active",
      classification: "Laboratory",
    });

    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );
    await clearFilter(page);
    await page
      .locator('[data-slot="table-body"]')
      .waitFor({ state: "visible" });

    const adRow = page.locator('[data-slot="table-row"]', {
      hasText: testAD.title,
    });

    await expect(adRow.getByText(testAD.title)).toBeVisible();
    if (testAD.description) {
      await expect(
        adRow.getByText(testAD.description, { exact: false }),
      ).toBeVisible();
    }

    const classificationBadge = adRow
      .locator('[data-slot="badge"]')
      .filter({ hasText: testAD.classification });
    await expect(classificationBadge).toBeVisible();

    const statusBadge = adRow
      .locator('[data-slot="badge"]')
      .filter({ hasText: testAD.status });
    await expect(statusBadge).toBeVisible();

    await expect(adRow.getByText(/service request/i)).toBeVisible();

    await adRow.locator('[data-slot="button"]', { hasText: "View" }).click();
    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${testAD.slug}`,
    );

    await page.goBack();
    await expect(adRow).toBeVisible();

    await adRow.locator('[data-slot="button"]', { hasText: "Edit" }).click();
    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/f-${facilityId}-${testAD.slug}/edit`,
    );
  });

  test("should navigate to create page when clicking add activity definition button", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    await page
      .getByRole("button", { name: /add activity definition/i })
      .click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}/new`,
    );
  });

  test("should navigate via breadcrumbs", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    const breadcrumb = page.locator('[data-slot="breadcrumb"]');

    const resourceCategoryElement = breadcrumb.locator(
      'span[data-slot="breadcrumb-page"]',
    );
    await expect(resourceCategoryElement).toHaveText(RESOURCE_CATEGORY_NAME);
    await expect(resourceCategoryElement).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    const activityDefinitionLink = breadcrumb.locator(
      '[data-slot="breadcrumb-link"]',
    );
    await expect(activityDefinitionLink).toContainText(/activity definition/i);
    await activityDefinitionLink.click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions`,
    );
  });

  test("should show existing activity definition when searching", async ({
    page,
  }) => {
    const testAD = await createActivityDefinition(page, facilityId, false, {
      status: "Active",
      classification: "Laboratory",
    });

    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );
    await clearFilter(page);
    await page
      .locator('[data-slot="table-body"]')
      .waitFor({ state: "visible" });

    const searchInput = page.getByPlaceholder(/search activity definition/i);
    await searchInput.fill(testAD.title);

    await expect(
      page.locator('[data-slot="table-row"]', { hasText: testAD.title }),
    ).toBeVisible();

    await searchInput.clear();
    await searchInput.fill(faker.string.uuid());

    await expect(
      page.locator('[data-slot="table-row"]', { hasText: testAD.title }),
    ).not.toBeVisible();

    await searchInput.clear();

    await expect(
      page.locator('[data-slot="table-row"]', { hasText: testAD.title }),
    ).toBeVisible();
  });

  test("should show no results message when searching for non-existent activity definition", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    await page
      .getByPlaceholder(/search activity definition/i)
      .fill(faker.string.alphanumeric(10));

    await expect(page.getByText(/no activity definition found/i)).toBeVisible();
  });
});
