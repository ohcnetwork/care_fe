import { expect, test } from "@playwright/test";
import {
  KITCHEN_SINK_FACILITY_SLUG,
  KITCHEN_SINK_INSTANCE_SLUG,
} from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Per-mount scoping: the admin mount lists instance questionnaires only and
 * the facility mount lists that facility's questionnaires only — pinned via
 * the two kitchen-sink fixtures, which share a searchable title prefix but
 * live in different auth contexts.
 */
test.describe("Questionnaire v2 per-mount scoping", () => {
  test("facility-scoped questionnaires are absent from the admin list and vice versa", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const tableBody = page.locator('[data-slot="table-body"]');

    await test.step("Admin list shows the instance fixture only", async () => {
      await page.goto("/admin/questionnaires");
      await page
        .getByPlaceholder("Search Questionnaires")
        .fill("E2E Kitchen Sink");
      await expect(tableBody).toContainText(KITCHEN_SINK_INSTANCE_SLUG);
      await expect(tableBody).not.toContainText(KITCHEN_SINK_FACILITY_SLUG);
    });

    await test.step("Facility list shows the facility fixture only", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires`);
      await page
        .getByPlaceholder("Search Questionnaires")
        .fill("E2E Kitchen Sink");
      await expect(tableBody).toContainText(KITCHEN_SINK_FACILITY_SLUG);
      await expect(tableBody).not.toContainText(KITCHEN_SINK_INSTANCE_SLUG);
    });
  });

  test("subject-type options differ per mount (patient is admin-only)", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await test.step("Admin create offers all five subject types", async () => {
      await page.goto("/admin/questionnaires/new");
      const group = page.getByRole("radiogroup", { name: "Subject Type" });
      await expect(group.getByRole("radio")).toHaveCount(5);
      for (const label of [
        "Patient",
        "Encounter",
        "Location",
        "Device",
        "Facility",
      ]) {
        await expect(
          group.getByRole("radio", { name: label, exact: true }),
        ).toBeVisible();
      }
    });

    await test.step("Facility create omits the Patient subject type", async () => {
      await page.goto(`/facility/${facilityId}/settings/questionnaires/new`);
      const group = page.getByRole("radiogroup", { name: "Subject Type" });
      await expect(group.getByRole("radio")).toHaveCount(4);
      await expect(
        group.getByRole("radio", { name: "Patient", exact: true }),
      ).not.toBeVisible();
      for (const label of ["Encounter", "Location", "Device", "Facility"]) {
        await expect(
          group.getByRole("radio", { name: label, exact: true }),
        ).toBeVisible();
      }
    });
  });
});
