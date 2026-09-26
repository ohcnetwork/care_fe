import { expect, test } from "@playwright/test";
import {
  PAGINATION_FIXTURE_COUNT,
  PAGINATION_TITLE_PREFIX,
} from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * List pagination via the 18 deterministic e2e-pagination-001..018 backend
 * fixtures (facility-scoped, active). The search box scopes the list to
 * exactly those rows, so page counts stay stable regardless of what other
 * tests create. Read-only — no spec mutates these fixtures.
 */
test.describe("Questionnaire v2 list pagination (fixtures)", () => {
  test("search-scoped list paginates to a second page", async ({ page }) => {
    const facilityId = getFacilityId();
    const rows = page.locator('[data-slot="table-body"] tr');

    await test.step("Search narrows the list to the 18 pagination fixtures", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires`);
      await page
        .getByPlaceholder("Search Questionnaires")
        .fill(PAGINATION_TITLE_PREFIX);
      await expect(rows).toHaveCount(15);
    });

    await test.step("Page 2 shows the remaining rows", async () => {
      await page.locator("#page-2").click();
      await expect(rows).toHaveCount(PAGINATION_FIXTURE_COUNT - 15);
      await expect(page.locator('[data-slot="table-body"]')).toContainText(
        "e2e-pagination-001",
      );
    });

    await test.step("Back to page 1 restores the first 15", async () => {
      await page.locator("#page-1").click();
      await expect(rows).toHaveCount(15);
    });
  });

  test("a list row activates with the keyboard", async ({ page }) => {
    const facilityId = getFacilityId();

    await test.step("Search down to a single fixture row", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires`);
      await page
        .getByPlaceholder("Search Questionnaires")
        .fill(`${PAGINATION_TITLE_PREFIX} 005`);
      await expect(page.locator('[data-slot="table-body"] tr')).toHaveCount(1);
    });

    await test.step("Enter on the focused row opens its detail page", async () => {
      const row = page
        .getByRole("link")
        .filter({ hasText: "E2E Pagination 005" });
      await row.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(/\/settings\/questionnaires\/[0-9a-f-]+$/);
      await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
        "E2E Pagination 005",
      );
    });
  });
});
