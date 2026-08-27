import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Patient Demography View", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  });

  test("should display patient demography page with basic details", async ({
    page,
  }) => {
    // The patient detail page renders its "Patient Details" header once loaded.
    await expect(
      page.getByRole("heading", { name: "Patient Details" }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should display demographic fields", async ({ page }) => {
    // Verify key demographic labels are visible. These are rendered as
    // label-value pairs in the Demography component.
    await expect(page.getByText(/full name/i).first()).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText(/phone number/i).first()).toBeVisible();

    // Genuine either/or: patients store an exact date of birth or just a year.
    await expect(
      page
        .getByText(/date of birth/i)
        .or(page.getByText(/year of birth/i))
        .first(),
    ).toBeVisible();

    await expect(page.getByText(/sex/i).first()).toBeVisible();

    await expect(page.getByText(/emergency contact/i).first()).toBeVisible();
  });

  test("should have edit button for general info section", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /edit/i }).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to patient update page when edit is clicked", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();

    await page.waitForURL(/\/update/);
    await expect(page).toHaveURL(/\/update/);
  });

  test("should display address information", async ({ page }) => {
    await expect(page.getByText(/current address/i).first()).toBeVisible({
      timeout: 10000,
    });
  });
});
