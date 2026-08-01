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

  test("should open the encounter update form with its fields", async ({
    page,
  }) => {
    await openUpdateForm(page);

    await expect(page.getByText("Encounter Status")).toBeVisible();
    await expect(page.getByText("Encounter Class")).toBeVisible();
    await expect(page.getByText("Priority")).toBeVisible();
  });

  test("should update the encounter priority", async ({ page }) => {
    await openUpdateForm(page);

    await page
      .getByRole("combobox")
      .filter({ hasText: "Timing critical" })
      .click();
    await page.getByRole("option", { name: "ASAP", exact: true }).click();

    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(
      page
        .locator("li[data-sonner-toast]")
        .getByText("Questionnaire submitted successfully"),
    ).toBeVisible();
  });

  test("should offer status options in the update form", async ({ page }) => {
    await openUpdateForm(page);

    // Verify the status field exposes its options without submitting a status
    // change (which would remove the shared fixture encounter from the
    // in-progress list other specs depend on).
    await page.getByRole("combobox").filter({ hasText: "In Progress" }).click();
    await expect(page.getByRole("option", { name: "On Hold" })).toBeVisible();
  });
});
