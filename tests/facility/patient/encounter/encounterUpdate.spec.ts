import { expect, test } from "@playwright/test";
import { openFirstInProgressEncounter } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Update", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await openFirstInProgressEncounter(page, facilityId);
  });

  async function openUpdateForm(page: import("@playwright/test").Page) {
    await page
      .locator('a[href*="/questionnaire/encounter"]:visible')
      .first()
      .click();
    await page.waitForURL(/\/questionnaire\/encounter/);
    await expect(page.getByText("Encounter Status")).toBeVisible();
  }

  test("should open the encounter update form with its fields", async ({
    page,
  }) => {
    await openUpdateForm(page);

    // Match exactly: the page also renders a questionnaire-JSON debug panel that
    // contains these words, which would otherwise trip strict-mode.
    await expect(
      page.getByText("Encounter Status", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Encounter Class", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Priority", { exact: true })).toBeVisible();
  });

  test("should offer priority options in the update form", async ({ page }) => {
    await openUpdateForm(page);

    // Verify the priority field's options render without submitting a change
    // (which would mutate the shared fixture encounter other specs depend on).
    await page.getByRole("combobox", { name: "Priority" }).click();
    await expect(page.getByRole("option").first()).toBeVisible();
  });

  test("should offer status options in the update form", async ({ page }) => {
    await openUpdateForm(page);

    // Verify the status field exposes its options without submitting a status
    // change (which would remove the shared fixture encounter from the
    // in-progress list other specs depend on).
    await page.getByRole("combobox", { name: "Encounter Status" }).click();
    await expect(page.getByRole("option", { name: "On Hold" })).toBeVisible();
  });
});
