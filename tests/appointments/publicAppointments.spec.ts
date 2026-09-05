import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

import { getCurrentUser } from "./helpers";

// Public patient OTP flow is unauthenticated
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Public Appointments OTP Page", () => {
  let facilityId: string;
  let staffId: string;

  test.beforeEach(async ({ page }) => {
    // Facility/staff IDs still come from authenticated setup helpers on disk
    facilityId = getFacilityId();
    staffId = (await getCurrentUser()).id;

    await page.goto(`/facility/${facilityId}/appointments/${staffId}/otp/send`);
  });

  test("should display patient login OTP send form", async ({ page }) => {
    await expect(page.getByText(/enter phone number to login/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/^phone number$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send otp/i })).toBeVisible();
  });

  test("should require a valid phone number before sending OTP", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /send otp/i }).click();
    await expect(
      page.getByText(/entered phone number is not valid/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/otp\/send/);
  });
});
