import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Encounter History Tab", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    await page.goto(`/facility/${facilityId}/patient/${patientId}/encounters`);
  });

  test("should display the patient's encounter history", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "View Encounter" }).first(),
    ).toBeVisible();
  });

  test("should offer scheduling an appointment", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Schedule Appointment" }),
    ).toBeVisible();
  });

  test("should navigate to the encounter from the history", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "View Encounter" }).first().click();

    await page.waitForURL(/\/encounter\/[^/]+/);
    await expect(page).toHaveURL(/\/encounter\/[^/]+/);
  });
});
