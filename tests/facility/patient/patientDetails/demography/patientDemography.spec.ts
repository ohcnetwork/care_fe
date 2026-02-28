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
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Verify patient name is visible (fixture patients have faker-generated names)
    // The page should have a heading or prominent text with the patient name
    const patientHeader = page.locator(
      '[data-slot="patient-info-hover-card-trigger"]',
    ).or(page.locator("h1, h2, h3").first());
    await expect(patientHeader.first()).toBeVisible({ timeout: 10000 });
  });

  test("should display demographic fields", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Verify key demographic fields are visible
    // These are displayed as label-value pairs in the Demography component

    // Full Name label should be present
    await expect(page.getByText(/full name/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Phone Number should be present
    await expect(page.getByText(/phone number/i).first()).toBeVisible();

    // Date of Birth or Year of Birth should be present
    const dobLabel = page
      .getByText(/date of birth/i)
      .or(page.getByText(/year of birth/i));
    await expect(dobLabel.first()).toBeVisible();

    // Sex should be present
    await expect(page.getByText(/sex/i).first()).toBeVisible();

    // Emergency Contact should be present
    await expect(page.getByText(/emergency contact/i).first()).toBeVisible();
  });

  test("should have edit button for general info section", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    // Look for the edit button in the general info section
    const editButton = page
      .getByRole("button", { name: /edit/i })
      .or(page.locator("button").filter({ has: page.locator("svg.lucide-pencil, svg.lucide-square-pen") }));

    await expect(editButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to patient update page when edit is clicked", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    // Click the edit button
    const editButton = page
      .getByRole("button", { name: /edit/i })
      .or(page.locator("button").filter({ has: page.locator("svg.lucide-pencil, svg.lucide-square-pen") }));

    await editButton.first().click();

    // Should navigate to the update page
    await page.waitForURL(/\/update/);
    await expect(page).toHaveURL(/\/update/);
  });

  test("should display address information", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Current address label should be present
    const addressLabel = page
      .getByText(/current address/i)
      .or(page.getByText(/address/i));
    await expect(addressLabel.first()).toBeVisible({ timeout: 10000 });
  });
});
