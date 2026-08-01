import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Encounter Diagnostic Reports Tab", () => {
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
