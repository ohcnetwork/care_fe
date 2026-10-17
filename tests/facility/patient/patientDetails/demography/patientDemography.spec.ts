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
    ).toBeVisible();
  });

  test("should display demographic fields", async ({ page }) => {
    // Exact label matches: an unanchored /sex/i would also match "Unisex" or
    // "Sexual history", so it could pass on unrelated text. Exact text makes
    // each assertion fail if that specific field disappears.
    await expect(
      page.getByText("Full Name", { exact: true }).first(),
    ).toBeVisible();

    await expect(
      page.getByText("Phone Number", { exact: true }).first(),
    ).toBeVisible();

    // Genuine either/or: patients store an exact date of birth or just a year.
    await expect(
      page
        .getByText("Date of Birth", { exact: true })
        .or(page.getByText("Year of Birth", { exact: true }))
        .first(),
    ).toBeVisible();

    await expect(page.getByText("Sex", { exact: true }).first()).toBeVisible();

    await expect(
      page.getByText("Emergency Contact", { exact: true }).first(),
    ).toBeVisible();
  });

  test("should have edit button for general info section", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /edit/i }).first(),
    ).toBeVisible();
  });

  test("should navigate to patient update page when edit is clicked", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();

    await page.waitForURL(/\/update/);
    await expect(page).toHaveURL(/\/update/);
  });

  test("should display address information", async ({ page }) => {
    await expect(
      page
        .getByText("Current Address and Route to Home", { exact: true })
        .first(),
    ).toBeVisible();
  });
});
