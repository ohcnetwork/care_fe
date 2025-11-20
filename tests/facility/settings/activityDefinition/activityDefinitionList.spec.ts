import { expect, test, type Page } from "@playwright/test";
import { Status } from "src/types/emr/activityDefinition/activityDefinition";

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
  await page.locator('[data-slot="table-body"]').waitFor({ state: "visible" });

  await selectFromFilterSelect(page, /status/i, status);

  await page.waitForLoadState("networkidle");

  // Wait for table body and all rows to be loaded
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
});
