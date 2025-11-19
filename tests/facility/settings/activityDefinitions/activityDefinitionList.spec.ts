import { expect, test } from "@playwright/test";

import {
  Classification,
  Status,
} from "src/types/emr/activityDefinition/activityDefinition";
import { createActivityDefinition } from "tests/helpers/activityDefinition";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let categorySlug: string;
const resourceCategoryName = "Lab Tests";

test.beforeAll(() => {
  facilityId = getFacilityId();
  categorySlug = `f-${facilityId}-lab-tests-activity_definition`;
});

test.beforeEach(async ({ page }) => {
  await page.goto(
    `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
  );
});

test.describe("activity definition list", () => {
  test("should display activity definitions list with correct initial state", async ({
    page,
  }) => {
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
    await expect(tableRows.nth(3)).toBeAttached();
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(4);

    await expect(
      page.getByText(/showing \d+ of \d+ activity definitions/i),
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

  test("should filter by status and verify all rows have matching status", async ({
    page,
  }) => {
    // Create ADs with each status for testing
    for (const status of Object.values(Status)) {
      await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { status },
      });
    }

    // Navigate back to list page
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    // Test each status filter
    for (const status of Object.values(Status)) {
      // Apply status filter - selecting directly replaces any existing selection
      const statusFilterTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /status/i });
      await statusFilterTrigger.click();
      await page.getByRole("option", { name: new RegExp(status, "i") }).click();

      // Get all visible rows
      const tableRows = page.locator(
        '[data-slot="table-body"] [data-slot="table-row"]',
      );
      const rowCount = await tableRows.count();

      if (rowCount > 0) {
        // Verify each visible row has the matching status
        for (let i = 0; i < rowCount; i++) {
          const row = tableRows.nth(i);
          await expect(row.getByText(new RegExp(status, "i"))).toBeVisible();
        }
      } else {
        // If no rows, verify the "no results" message
        await expect(
          page.getByText(/no activity definition found/i),
        ).toBeVisible();
      }

      // Verify count message is visible
      await expect(
        page.getByText(/showing \d+ of \d+ activity definitions/i),
      ).toBeVisible();
    }
  });

  test("should filter by category/classification and verify all rows have matching classification", async ({
    page,
  }) => {
    // Create ADs with each classification for testing
    for (const classification of Object.values(Classification)) {
      await createActivityDefinition(page, facilityId, {
        resourceCategoryName,
        overrides: { classification },
      });
    }

    // Navigate back to list page
    await page.goto(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}`,
    );

    // Test each classification filter
    for (const classification of Object.values(Classification)) {
      // Apply classification filter - selecting directly replaces any existing selection
      const categoryFilterTrigger = page
        .locator('[data-slot="select-trigger"]')
        .filter({ hasText: /category/i });
      await categoryFilterTrigger.click();
      await page
        .getByRole("option", {
          name: new RegExp(classification.replace(/_/g, "\\s"), "i"),
        })
        .click();

      // Get all visible rows
      const tableRows = page.locator(
        '[data-slot="table-body"] [data-slot="table-row"]',
      );
      const rowCount = await tableRows.count();

      if (rowCount > 0) {
        // Verify each visible row has the matching classification
        const classificationPattern = new RegExp(
          classification.replace(/_/g, "\\s"),
          "i",
        );
        for (let i = 0; i < rowCount; i++) {
          const row = tableRows.nth(i);
          await expect(row.getByText(classificationPattern)).toBeVisible();
        }
      } else {
        // If no rows, verify the "no results" message
        await expect(
          page.getByText(/no activity definition found/i),
        ).toBeVisible();
      }

      // Verify count message is visible
      await expect(
        page.getByText(/showing \d+ of \d+ activity definitions/i),
      ).toBeVisible();
    }
  });

  test("should display correct content in a table row", async ({ page }) => {
    const tableRows = page.locator(
      '[data-slot="table-body"] [data-slot="table-row"]',
    );
    await expect(tableRows.first()).toBeVisible();

    const lipidPanelRow = tableRows.filter({ hasText: "Lipid Panel" });
    await expect(lipidPanelRow).toBeVisible();

    await expect(lipidPanelRow.getByText("Lipid Panel")).toBeVisible();
    await expect(
      lipidPanelRow.getByText(/comprehensive blood test measuring/i),
    ).toBeVisible();

    await expect(lipidPanelRow.getByText("Laboratory")).toBeVisible();

    await expect(lipidPanelRow.getByText("Active")).toBeVisible();

    await expect(lipidPanelRow.getByText("Service Request")).toBeVisible();

    await expect(
      lipidPanelRow.getByRole("link", { name: /view/i }),
    ).toBeVisible();
    await expect(
      lipidPanelRow.getByRole("link", { name: /edit/i }),
    ).toBeVisible();
  });
});
