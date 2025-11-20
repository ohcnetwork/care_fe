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
const resourceCategoryName = "Lab Tests";
const categorySlugSuffix = "lab-tests-activity_definition";

test.beforeAll(() => {
  facilityId = getFacilityId();
});

async function filterAndVerifyByStatus(
  page: Page,
  status: Status,
  createdADTitle: string,
) {
  const categorySlug = `f-${facilityId}-${categorySlugSuffix}`;
  await page.goto(
    `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
  );
  await clearFilter(page);
  await page.locator("table tbody").waitFor({ state: "visible" });

  await selectFromFilterSelect(page, /status/i, status);

  await page.waitForLoadState("networkidle");
  await page.locator("table tbody").waitFor({ state: "visible" });

  // Verify ALL table rows have the matching status badge
  const tableRows = page.locator("table tbody tr");
  const rowCount = await tableRows.count();

  if (rowCount > 0) {
    for (let i = 0; i < rowCount; i++) {
      const row = tableRows.nth(i);
      // Find the status badge directly in the row by matching the status text
      const statusBadge = row
        .locator('[data-slot="badge"]')
        .filter({ hasText: new RegExp(status, "i") });
      await expect(statusBadge).toBeVisible();
    }
  }

  const adRow = page.locator("tr", { hasText: createdADTitle });
  await expect(adRow).toBeVisible();
}

async function filterAndVerifyByClassification(
  page: Page,
  classification: Classification,
  createdADTitle: string,
) {
  const categorySlug = `f-${facilityId}-${categorySlugSuffix}`;
  await page.goto(
    `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
  );
  await clearFilter(page);
  await page.locator("table tbody").waitFor({ state: "visible" });

  const classificationDisplayText = classification.replace(/_/g, " ");
  await selectFromFilterSelect(page, /category/i, classificationDisplayText);

  await page.waitForLoadState("networkidle");
  await page.locator("table tbody").waitFor({ state: "visible" });

  // Verify ALL table rows have the matching classification badge
  const tableRows = page.locator("table tbody tr");
  const rowCount = await tableRows.count();

  if (rowCount > 0) {
    for (let i = 0; i < rowCount; i++) {
      const row = tableRows.nth(i);
      const classificationBadge = row
        .locator('[data-slot="badge"]')
        .filter({ hasText: new RegExp(classificationDisplayText, "i") });
      await expect(classificationBadge).toBeVisible();
    }
  }

  const adRow = page.locator("tr", { hasText: createdADTitle });
  await expect(adRow).toBeVisible();
}

test.describe("Activity Definition List Filter", () => {
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
});
