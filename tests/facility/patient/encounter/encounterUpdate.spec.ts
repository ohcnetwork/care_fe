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

    // Navigate to encounters list filtered by in-progress status
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );
  });

  test("should navigate to encounter update form via details panel", async ({
    page,
  }) => {
    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    // Wait for the encounter page to load
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    // Navigate to the Updates tab (which contains the encounter details panel)
    const updatesTab = page.getByRole("tab", { name: "Updates" });
    if (await updatesTab.isVisible()) {
      await updatesTab.click();
    }

    // Find and click the update encounter link (pen icon button in encounter details)
    const updateLink = page.locator('a[href*="/questionnaire/encounter"]');
    await updateLink.first().waitFor({ state: "visible" });
    await updateLink.first().click();

    // Wait for the questionnaire form to load
    await page.waitForURL(/\/questionnaire\/encounter/);

    // Verify the encounter update form is displayed with status, class, and priority fields
    await expect(page.getByText("Encounter Status")).toBeVisible();
    await expect(page.getByText("Encounter Class")).toBeVisible();
    await expect(page.getByText("Priority")).toBeVisible();
  });

  test("should update encounter priority", async ({ page }) => {
    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    // Navigate to encounter update form
    const updateLink = page.locator('a[href*="/questionnaire/encounter"]');
    await updateLink.first().waitFor({ state: "visible" });
    await updateLink.first().click();
    await page.waitForURL(/\/questionnaire\/encounter/);

    // Wait for form to load
    await expect(page.getByText("Encounter Status")).toBeVisible();

    // Change priority
    await test.step("Change encounter priority", async () => {
      const prioritySelect = page
        .locator("div")
        .filter({ hasText: /^Priority$/ })
        .locator("..")
        .getByRole("combobox");
      await prioritySelect.click();
      await page.getByRole("option", { name: /ASAP/i }).click();
    });

    // Submit the form
    await test.step("Submit the update form", async () => {
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Questionnaire submitted successfully"),
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test("should update encounter status to on-hold", async ({ page }) => {
    // Click on the first encounter
    await page.getByRole("link", { name: "View Encounter" }).first().click();
    await page.waitForURL(
      /\/facility\/[^/]+\/patient\/[^/]+\/encounter\/[^/]+/,
    );

    // Navigate to encounter update form
    const updateLink = page.locator('a[href*="/questionnaire/encounter"]');
    await updateLink.first().waitFor({ state: "visible" });
    await updateLink.first().click();
    await page.waitForURL(/\/questionnaire\/encounter/);

    // Wait for form to load
    await expect(page.getByText("Encounter Status")).toBeVisible();

    // Change status to On Hold
    await test.step("Change encounter status to On Hold", async () => {
      const statusSelect = page
        .locator("div")
        .filter({ hasText: /^Encounter Status$/ })
        .locator("..")
        .getByRole("combobox");
      await statusSelect.click();
      await page.getByRole("option", { name: /On Hold/i }).click();
    });

    // Submit the form
    await test.step("Submit the update form", async () => {
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page
          .locator("li[data-sonner-toast]")
          .getByText("Questionnaire submitted successfully"),
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
