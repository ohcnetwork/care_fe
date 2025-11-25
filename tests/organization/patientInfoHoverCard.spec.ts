import { expect, test } from "@playwright/test";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });

test.describe("PatientInfoHoverCard Conditional Rendering", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (user is already authenticated)
    await page.goto("/");
  });

  test("should show Patient Home button in encounter accessed via facility route", async ({
    page,
  }) => {
    // Navigate to a facility
    await page
      .getByRole("link", { name: /facility with patients/i })
      .first()
      .click();

    // Wait for facility page to load
    await page.waitForURL("**/facility/**");

    // Extract facilityId from URL
    const currentUrl = page.url();
    const facilityIdMatch = currentUrl.match(/\/facility\/([^/]+)/);
    const facilityId = facilityIdMatch ? facilityIdMatch[1] : null;
    expect(facilityId).toBeTruthy();

    // Navigate to encounters section via sidebar
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("button", { name: "Encounters" }).click();
    await page
      .getByRole("link", { name: "View All Encounters", exact: true })
      .click();

    // Wait for encounters page to load
    await page.waitForURL("**/encounters/**");

    // Click on the first encounter card to view an encounter
    const encounterLink = page
      .getByRole("link", { name: "View Encounter" })
      .first();
    await encounterLink.waitFor({ state: "visible", timeout: 10000 });
    await encounterLink.click();

    // Wait for encounter page to load
    await page.waitForURL("**/encounter/**");

    // Verify URL contains facilityId
    expect(page.url()).toContain(`/facility/${facilityId}/patient/`);

    // Wait for patient hover card trigger to appear
    const hoverCardTrigger = page
      .locator("[data-slot='patient-info-hover-card-trigger']")
      .first();
    await hoverCardTrigger.waitFor({ state: "visible", timeout: 10000 });

    // Click the hover card trigger
    await hoverCardTrigger.click();

    // Verify that Patient Home button is visible (because facilityId is available)
    await expect(page.getByRole("link", { name: "Patient Home" })).toBeVisible({
      timeout: 5000,
    });

    // Verify that View Profile button is also visible
    await expect(page.getByRole("link", { name: "View Profile" })).toBeVisible({
      timeout: 5000,
    });

    // Verify the View Profile href includes facilityId
    const viewProfileLink = page.getByRole("link", { name: "View Profile" });
    const href = await viewProfileLink.getAttribute("href");
    expect(href).toContain(`/facility/${facilityId}/patient/`);
  });

  test("should NOT show Patient Home button in encounter accessed via organization route", async ({
    page,
  }) => {
    // Navigate to organization page
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

    // Wait for organization page to load
    await page.waitForURL("**/organization/**");

    // Extract organizationId from URL
    const currentUrl = page.url();
    const orgIdMatch = currentUrl.match(/\/organization\/([^/]+)/);
    const organizationId = orgIdMatch ? orgIdMatch[1] : null;
    expect(organizationId).toBeTruthy();

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

    // Wait a bit for the page to load
    await page.waitForLoadState("networkidle");

    // Try to find an encounter link or button
    const encounterLink = page
      .getByRole("link", { name: /view encounter/i })
      .first();

    // Check if encounter link exists
    const encounterExists = await encounterLink.count();

    if (encounterExists > 0) {
      await encounterLink.click();

      // Wait for encounter page to load
      await page.waitForURL("**/encounter/**");

      // Verify URL contains organizationId and NOT facilityId
      expect(page.url()).toContain(`/organization/${organizationId}/patient/`);
      expect(page.url()).not.toContain("/facility/");

      // Wait for patient info hover card trigger
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
      await expect(
        page.getByRole("link", { name: "View Profile" }),
      ).toBeVisible({
        timeout: 5000,
      });

      // Verify the View Profile href does NOT include facilityId
      const viewProfileLink = page.getByRole("link", { name: "View Profile" });
      const href = await viewProfileLink.getAttribute("href");
      expect(href).not.toContain("/facility/");
      expect(href).toMatch(/^\/patient\/[^/]+$/);
    } else {
      // If no encounters, at least verify the patient hover card works correctly
      const hoverCardTrigger = page
        .locator("[data-slot='patient-info-hover-card-trigger']")
        .first();

      const hoverCardExists = await hoverCardTrigger.count();
      if (hoverCardExists > 0) {
        await hoverCardTrigger.waitFor({ state: "visible", timeout: 10000 });
        await hoverCardTrigger.click();

        // Verify that Patient Home button is NOT visible
        await expect(
          page.getByRole("link", { name: "Patient Home" }),
        ).not.toBeVisible({ timeout: 2000 });

        // But View Profile button should still be visible
        await expect(
          page.getByRole("link", { name: "View Profile" }),
        ).toBeVisible({
          timeout: 5000,
        });
      }
    }
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
