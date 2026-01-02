import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;

test.describe("Payment Reconciliation", () => {
  facilityId = getFacilityId();

  test.beforeEach(async ({ page }) => {
    const targetUrl = `/facility/${facilityId}/overview`;
    await page.goto(targetUrl);
  });

  test("should navigate to appointments page when appointments card is clicked", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /appointments/i }).click();

    await expect(page.url()).toContain(`/facility/${facilityId}/appointments`);
  });

  test("should navigate to encounters page when encounters card is clicked", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /encounters/i }).click();

    await expect(page.url()).toContain(
      `/facility/${facilityId}/encounters/patients/`,
    );
  });

  test("should navigate to services page when services card is clicked", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /services/i }).click();

    await expect(page).toHaveURL(`/facility/${facilityId}/services`);
  });
});
