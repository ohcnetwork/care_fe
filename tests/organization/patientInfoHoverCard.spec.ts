import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("PatientInfoHoverCard Conditional Rendering", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (user is already authenticated)
    await page.goto("/");
  });

  test("should show Patient Home button when accessed via facility route", async ({
    page,
  }) => {
    // Navigate to a facility
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    // Wait for facility page to load
    await page.waitForURL("**/facility/**");

    // Navigate to patients section via sidebar
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Patients", exact: true }).click();
    await page.getByRole("link", { name: /search patients/i }).click();

    // Search for a patient to trigger the hover card
    const searchInput = page.getByRole("textbox", {
      name: /search by patient phone number/i,
    });
    await searchInput.fill("9");

    // Wait for patient hover card trigger to appear
    const hoverCardTrigger = page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .first();
    await hoverCardTrigger.waitFor({ state: "visible", timeout: 10000 });

    // Click the hover card trigger
    await hoverCardTrigger.click();

    // Verify that Patient Home button is visible
    await expect(page.getByRole("link", { name: "Patient Home" })).toBeVisible({
      timeout: 5000,
    });

    // Verify that View Profile button is also visible
    await expect(page.getByRole("link", { name: "View Profile" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("should NOT show Patient Home button when accessed via organization route", async ({
    page,
  }) => {
    // Navigate to organization patients page
    await page.goto("/organization");

    // Wait for organization list to load
    await page.waitForLoadState("networkidle");

    // Find and click on an organization
    const organizationLink = page.getByRole("link").filter({
      has: page.locator("text=/organization/i"),
    });

    // Verify that at least one organization exists
    const orgCount = await organizationLink.count();
    expect(orgCount).toBeGreaterThan(
      0,
      "Expected at least one organization to be available for testing",
    );

    await organizationLink.first().click();

    // Navigate to patients tab
    await page.getByRole("link", { name: "Patients" }).click();

    // Wait for patients to load
    await page.waitForLoadState("networkidle");

    // Verify that at least one patient exists
    const patientCards = page.locator("a[href*='/patient/']");
    const patientCount = await patientCards.count();
    expect(patientCount).toBeGreaterThan(
      0,
      "Expected at least one patient to be available for testing",
    );

    // Click on a patient card to go to patient detail page
    await patientCards.first().click();

    // Wait for patient page to load
    await page.waitForURL("**/patient/**");

    // Wait for patient info hover card trigger on the patient details page
    const hoverCardTrigger = page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .first();
    await hoverCardTrigger.waitFor({ state: "visible", timeout: 10000 });

    // Click the hover card trigger
    await hoverCardTrigger.click();

    // Verify that Patient Home button is NOT visible (because facilityId is not available)
    await expect(
      page.getByRole("link", { name: "Patient Home" }),
    ).not.toBeVisible({ timeout: 2000 });

    // But View Profile button should still be visible
    await expect(page.getByRole("link", { name: "View Profile" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("should render correct href for View Profile button based on facilityId", async ({
    page,
  }) => {
    // Navigate to a facility
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    // Wait for facility page to load and extract facilityId from URL
    await page.waitForURL("**/facility/**");
    const currentUrl = page.url();
    const facilityIdMatch = currentUrl.match(/\/facility\/([^/]+)/);
    const facilityId = facilityIdMatch ? facilityIdMatch[1] : null;

    // Verify that facilityId was extracted from URL
    expect(facilityId).toBeTruthy();
    expect(facilityId).not.toBeNull();

    // Navigate to patients section
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Patients", exact: true }).click();
    await page.getByRole("link", { name: /search patients/i }).click();

    // Search for a patient
    const searchInput = page.getByRole("textbox", {
      name: /search by patient phone number/i,
    });
    await searchInput.fill("9");

    // Wait for hover card trigger to appear
    const hoverCardTrigger = page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .first();
    await hoverCardTrigger.waitFor({ state: "visible", timeout: 10000 });

    // Click the hover card trigger
    await hoverCardTrigger.click();

    // Get the View Profile link and verify it contains the facilityId
    const viewProfileLink = page.getByRole("link", {
      name: "View Profile",
    });
    await expect(viewProfileLink).toBeVisible();

    const href = await viewProfileLink.getAttribute("href");
    expect(href).toContain(`/facility/${facilityId}/patient/`);
  });

  test("should not show Patient Home button on patient home page", async ({
    page,
  }) => {
    // Navigate to a facility
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    // Wait for facility page to load
    await page.waitForURL("**/facility/**");

    // Navigate to patient verification/home page directly
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Patients", exact: true }).click();
    await page.getByRole("link", { name: /search patients/i }).click();

    // Now we're on the patient search/verification page
    await page.waitForURL("**/patients/verify");

    // Search for a patient
    const searchInput = page.getByRole("textbox", {
      name: /search by patient phone number/i,
    });
    await searchInput.fill("9");

    // Wait for hover card trigger to appear
    const hoverCardTrigger = page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .first();
    await hoverCardTrigger.waitFor({ state: "visible", timeout: 10000 });

    // Click the hover card trigger
    await hoverCardTrigger.click();

    // Verify that Patient Home button is NOT visible (because we're already on patient home page)
    await expect(
      page.getByRole("link", { name: "Patient Home" }),
    ).not.toBeVisible({ timeout: 2000 });

    // But View Profile button should still be visible
    await expect(page.getByRole("link", { name: "View Profile" })).toBeVisible({
      timeout: 5000,
    });
  });
});
