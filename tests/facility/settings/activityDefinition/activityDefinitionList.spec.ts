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
      const statusCell = row.locator("td").nth(2);
      const statusBadge = statusCell.locator('[data-slot="badge"]');
      await expect(statusBadge).toHaveText(new RegExp(status, "i"));
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
});
