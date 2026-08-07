import { expect, test } from "@playwright/test";
import { openFirstInProgressEncounter } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Diagnostic Reports Tab", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    await openFirstInProgressEncounter(page, facilityId);
  });

  test("should display the diagnostic reports tab with its empty state", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Diagnostic Reports" }).click();
    await expect(page).toHaveURL(/\/diagnostic_reports$/);

    await expect(
      page.getByRole("tabpanel", { name: "Diagnostic Reports" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No Diagnostic Reports Found" }),
    ).toBeVisible();
  });

  test("should navigate to diagnostic reports from the tab bar", async ({
    page,
  }) => {
    const tab = page.getByRole("tab", { name: "Diagnostic Reports" });
    await expect(tab).toBeVisible();
    await tab.click();

    await expect(page).toHaveURL(/\/diagnostic_reports$/);
  });

  test("should render the responses tab without errors", async ({ page }) => {
    await page.getByRole("tab", { name: "Responses" }).click();
    await expect(page).toHaveURL(/\/responses$/);

    await expect(
      page.getByRole("tabpanel", { name: "Responses" }),
    ).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toBeHidden();
  });
});
