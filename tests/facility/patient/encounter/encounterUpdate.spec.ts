import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Update", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
  });

  async function openUpdateForm(page: import("@playwright/test").Page) {
    await page
      .locator('a[href*="/questionnaire/encounter"]:visible')
      .first()
      .click();
    await page.waitForURL(/\/questionnaire\/encounter/);
    await expect(page.getByText("Encounter Status")).toBeVisible();
  }

  // The questionnaire's select fields have no accessible name, and their current
  // value varies by fixture data. Anchor on the visible label and take the
  // combobox that follows it — robust to values and field order.
  function fieldCombobox(page: import("@playwright/test").Page, label: string) {
    return page
      .getByText(label, { exact: true })
      .locator("xpath=following::*[@role='combobox'][1]");
  }

  test("should open the encounter update form with its fields", async ({
    page,
  }) => {
    await openUpdateForm(page);

    await expect(page.getByText("Encounter Status")).toBeVisible();
    await expect(page.getByText("Encounter Class")).toBeVisible();
    await expect(page.getByText("Priority")).toBeVisible();
  });

  test("should offer priority options in the update form", async ({ page }) => {
    await openUpdateForm(page);

    // Verify the priority field's options render without submitting a change
    // (which would mutate the shared fixture encounter other specs depend on).
    await fieldCombobox(page, "Priority").click();
    await expect(page.getByRole("option").first()).toBeVisible();
  });

  test("should offer status options in the update form", async ({ page }) => {
    await openUpdateForm(page);

    // Verify the status field exposes its options without submitting a status
    // change (which would remove the shared fixture encounter from the
    // in-progress list other specs depend on).
    await fieldCombobox(page, "Encounter Status").click();
    await expect(page.getByRole("option", { name: "On Hold" })).toBeVisible();
  });
});
