import { expect, test, type Page } from "@playwright/test";
import {
  Classification,
  Status,
} from "src/types/emr/activityDefinition/activityDefinition";

import { createActivityDefinition } from "tests/helpers/activityDefinition";
import { clearFilter, selectFromFilterSelect } from "tests/helpers/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let categorySlug: string;
const resourceCategoryName = "Lab Tests";
const categorySlugSuffix = "lab-tests-activity_definition";

test.beforeAll(() => {
  facilityId = getFacilityId();
  categorySlug = `f-${facilityId}-${categorySlugSuffix}`;
});

async function filterAndVerifyByStatus(
  page: Page,
  status: Status,
  createdADTitle: string,
) {
  await page.goto(
    `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
  );
  await clearFilter(page);
  await page.locator('[data-slot="table-body"]').waitFor({ state: "visible" });

  await selectFromFilterSelect(page, /status/i, status);

  await page.waitForLoadState("networkidle");

  const tableBody = page.locator('[data-slot="table-body"]');
  await tableBody.waitFor({ state: "visible" });

  const tableBodyRows = tableBody.locator('[data-slot="table-row"]');
  await tableBodyRows.first().waitFor({ state: "visible" });
  const rowCount = await tableBodyRows.count();

  if (rowCount > 0) {
    const statusText = tableBody.getByText(new RegExp(status, "i"));
    await expect(statusText).toHaveCount(rowCount);
  }

  const adRow = page.locator('[data-slot="table-row"]', {
    hasText: createdADTitle,
  });
  await expect(adRow).toBeVisible();
}

async function filterAndVerifyByClassification(
  page: Page,
  classification: Classification,
  createdADTitle: string,
) {
  await page.goto(
    `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
  );
  await clearFilter(page);
  await page.locator('[data-slot="table-body"]').waitFor({ state: "visible" });

  // Convert classification enum to display format (replace underscores with spaces)
  const classificationDisplayText = classification.replace(/_/g, " ");
  await selectFromFilterSelect(page, /category/i, classificationDisplayText);

  await page.waitForLoadState("networkidle");

  // Wait for table body and all rows to be loaded
  const tableBody = page.locator('[data-slot="table-body"]');
  await tableBody.waitFor({ state: "visible" });

  const tableBodyRows = tableBody.locator('[data-slot="table-row"]');
  await tableBodyRows.first().waitFor({ state: "visible" });
  const rowCount = await tableBodyRows.count();

  if (rowCount > 0) {
    const allBadges = tableBody.locator('[data-slot="badge"]');
    const classificationBadges = allBadges.filter({
      hasText: new RegExp(`^${classificationDisplayText}$`, "i"),
    });
    await expect(classificationBadges).toHaveCount(rowCount);
  }

  const adRow = page.locator('[data-slot="table-row"]', {
    hasText: createdADTitle,
  });
  await expect(adRow).toBeVisible();
}

test.describe("Activity Definition List Filter", () => {
  test.describe("Status Filter", () => {
    test("should filter activity definitions by draft status", async ({
      page,
    }) => {
      const draftAD = await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { status: Status.draft },
      });

      await filterAndVerifyByStatus(page, Status.draft, draftAD.title);
    });

    test("should filter activity definitions by active status", async ({
      page,
    }) => {
      const activeAD = await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { status: Status.active },
      });

      await filterAndVerifyByStatus(page, Status.active, activeAD.title);
    });

    test("should filter activity definitions by retired status", async ({
      page,
    }) => {
      const retiredAD = await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { status: Status.retired },
      });

      await filterAndVerifyByStatus(page, Status.retired, retiredAD.title);
    });

    test("should filter activity definitions by unknown status", async ({
      page,
    }) => {
      const unknownAD = await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { status: Status.unknown },
      });

      await filterAndVerifyByStatus(page, Status.unknown, unknownAD.title);
    });
  });

  test.describe("Classification Filter", () => {
    test("should filter activity definitions by laboratory classification", async ({
      page,
    }) => {
      const laboratoryAD = await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { classification: Classification.laboratory },
      });

      await filterAndVerifyByClassification(
        page,
        Classification.laboratory,
        laboratoryAD.title,
      );
    });

    test("should filter activity definitions by imaging classification", async ({
      page,
    }) => {
      const imagingAD = await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { classification: Classification.imaging },
      });

      await filterAndVerifyByClassification(
        page,
        Classification.imaging,
        imagingAD.title,
      );
    });

    test("should filter activity definitions by surgical procedure classification", async ({
      page,
    }) => {
      const surgicalAD = await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { classification: Classification.surgical_procedure },
      });

      await filterAndVerifyByClassification(
        page,
        Classification.surgical_procedure,
        surgicalAD.title,
      );
    });

    test("should filter activity definitions by counselling classification", async ({
      page,
    }) => {
      const counsellingAD = await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { classification: Classification.counselling },
      });

      await filterAndVerifyByClassification(
        page,
        Classification.counselling,
        counsellingAD.title,
      );
    });
  });

  test("should verify row content and navigate to view and edit pages", async ({
    page,
  }) => {
    const testAD = await createActivityDefinition(page, facilityId, {
      resourceCategoryName,
      overrides: {
        status: Status.active,
        classification: Classification.laboratory,
      },
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
    await expect(adRow).toBeVisible();

    await expect(adRow.getByText(testAD.title)).toBeVisible();
    if (testAD.description) {
      await expect(
        adRow.getByText(testAD.description, { exact: false }),
      ).toBeVisible();
    }

    const classificationDisplayText = testAD.classification.replace(/_/g, " ");
    const classificationBadge = adRow
      .locator('[data-slot="badge"]')
      .filter({ hasText: new RegExp(classificationDisplayText, "i") });
    await expect(classificationBadge).toBeVisible();

    const statusBadge = adRow
      .locator('[data-slot="badge"]')
      .filter({ hasText: new RegExp(testAD.status, "i") });
    await expect(statusBadge).toBeVisible();

    await expect(adRow.getByText(/service request/i)).toBeVisible();

    const viewLink = adRow.getByRole("link", { name: /view/i });
    await expect(viewLink).toBeVisible();
    const viewHref = await viewLink.getAttribute("href");
    expect(viewHref).toBeTruthy();

    const slugMatch = viewHref!.match(
      /\/settings\/activity_definitions\/([^/]+)/,
    );
    expect(slugMatch).toBeTruthy();
    const activityDefinitionSlug = slugMatch![1];

    await viewLink.click();
    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/${activityDefinitionSlug}`,
    );

    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );
    await page
      .locator('[data-slot="table-body"]')
      .waitFor({ state: "visible" });

    await expect(adRow).toBeVisible();

    const editLink = adRow.getByRole("link", { name: /edit/i });
    await expect(editLink).toBeVisible();
    await editLink.click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/${activityDefinitionSlug}/edit`,
    );
  });

  test("should navigate to create page when clicking add activity definition button", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    const addButton = page.getByRole("button", {
      name: /add activity definition/i,
    });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}/new`,
    );
  });

  test("should navigate via breadcrumbs", async ({ page }) => {
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    const breadcrumb = page.locator('[data-slot="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    const resourceCategoryBreadcrumb =
      breadcrumb.getByText(resourceCategoryName);
    await expect(resourceCategoryBreadcrumb).toBeVisible();
    const resourceCategoryElement = breadcrumb.locator(
      `span[data-slot="breadcrumb-page"]`,
    );
    await expect(resourceCategoryElement).toHaveText(resourceCategoryName);
    await expect(resourceCategoryElement).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    const activityDefinitionLink = breadcrumb
      .locator('[data-slot="breadcrumb-link"]')
      .first();
    await expect(activityDefinitionLink).toBeVisible();
    await expect(activityDefinitionLink).toContainText(/activity definition/i);
    await activityDefinitionLink.click();

    await expect(page).toHaveURL(
      `/facility/${facilityId}/settings/activity_definitions`,
    );
  });
});
