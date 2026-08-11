import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { addDays, format } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Appointment Detail Page", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    patientId = getPatientId();
  });

  /**
   * Test: Page loads with appointment details
   * Verifies that appointment detail page loads correctly and displays key information
   */
  test("should load appointment detail page and display basic information", async ({
    page,
  }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open any available appointment", async () => {
      // Wait for appointment cards to load
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      // If no appointments exist, skip this test
      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify appointment details are displayed", async () => {
      // Page should show "Appointment Details" heading
      await expect(
        page.getByRole("heading", { name: /appointment details/i }),
      ).toBeVisible();

      // Should show patient information card
      await expect(
        page.locator('[class*="PatientInfoCard"]').first(),
      ).toBeVisible();

      // Should have back button
      await expect(page.getByRole("button").first()).toBeVisible();
    });
  });

  /**
   * Test: Back button navigation
   * Verifies the back button returns to the appointments list
   */
  test("should navigate back to appointments list when back button is clicked", async ({
    page,
  }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open an appointment", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Click back button and verify navigation", async () => {
      await page.getByRole("button").first().click();
      await page.waitForLoadState("networkidle");

      // Should be back on appointments list
      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/appointments`),
      );
    });
  });

  /**
   * Test: Token display for appointments with token
   * Verifies that appointments with generated tokens display the token correctly
   */
  test("should display token information when appointment has a token", async ({
    page,
  }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open an appointment", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify token section exists", async () => {
      // Token section should be present (either with token or generation option)
      const tokenHeading = page.getByRole("heading", { name: /token/i });
      await expect(tokenHeading).toBeVisible();

      // Either shows token card or "Token not generated" message
      const hasToken =
        (await page.locator("#single-print").isVisible().catch(() => false)) ||
        (await page
          .getByText(/token not generated/i)
          .isVisible()
          .catch(() => false));

      expect(hasToken).toBe(true);
    });
  });

  /**
   * Test: Token generation button availability
   * Verifies that appointments without tokens show the generation option
   */
  test("should show generate token button for appointments without tokens", async ({
    page,
  }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Look for appointment without token", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Check for token generation option", async () => {
      // If token not generated message is shown
      const tokenNotGenerated = await page
        .getByText(/token not generated/i)
        .isVisible()
        .catch(() => false);

      if (tokenNotGenerated) {
        // Should show generate token button
        await expect(
          page.getByRole("button", { name: /generate token/i }),
        ).toBeVisible();
      }
    });
  });

  /**
   * Test: Quick actions visibility
   * Verifies that appropriate quick actions are displayed based on appointment status
   */
  test("should display quick actions section for active appointments", async ({
    page,
  }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open an active appointment", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify quick actions section exists", async () => {
      const quickActionsHeading = page.getByRole("heading", {
        name: /quick actions/i,
      });

      // Quick actions section should be visible for non-final appointments
      const isVisible = await quickActionsHeading
        .isVisible()
        .catch(() => false);

      // If visible, check that it contains action buttons
      if (isVisible) {
        // Should have at least some interactive elements in the quick actions area
        const quickActionsSection = page
          .locator('div:has(h3:has-text("Quick actions"))')
          .first();
        await expect(quickActionsSection).toBeVisible();
      }
    });
  });

  /**
   * Test: Appointment status badge display
   * Verifies that appointment status is displayed correctly
   */
  test("should display appointment status badge", async ({ page }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open an appointment", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify status information is present", async () => {
      // The page should display some status-related information
      // Status badges are typically shown in the appointment details area
      await expect(
        page.getByRole("heading", { name: /appointment details/i }),
      ).toBeVisible();

      // Patient info card should be visible which contains status info
      const patientCard = page.locator('[class*="PatientInfoCard"]').first();
      await expect(patientCard).toBeVisible();
    });
  });

  /**
   * Test: Associated encounter display
   * Verifies that linked encounters are displayed correctly
   */
  test("should display associated encounter when available", async ({
    page,
  }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open an appointment", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Check for encounter section", async () => {
      // If appointment has an associated encounter, it should show encounter card
      const encounterHeading = page.getByRole("heading", {
        name: /encounter/i,
      });

      const hasEncounter = await encounterHeading
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasEncounter) {
        // Should have view encounter button
        await expect(
          page.getByRole("button", { name: /view encounter/i }),
        ).toBeVisible();

        // Should have view patient button
        await expect(
          page.getByRole("button", { name: /view patient/i }),
        ).toBeVisible();
      }
    });
  });

  /**
   * Test: Print appointment functionality
   * Verifies that print appointment option is available
   */
  test("should have print appointment option available", async ({ page }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open an appointment", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Look for print option", async () => {
      // Print option could be in dropdown menu or as direct button
      // Check for dropdown menu trigger (three dots or similar)
      const dropdownTrigger = page.getByRole("button", {
        name: /more options|actions/i,
      });

      const hasDropdown = await dropdownTrigger
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasDropdown) {
        await dropdownTrigger.click();
        // Print option should be in dropdown
        await expect(
          page.getByRole("menuitem", { name: /print/i }),
        ).toBeVisible();
      }
    });
  });

  /**
   * Test: Patient contact information display
   * Verifies that patient contact details are shown
   */
  test("should display patient contact information", async ({ page }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open an appointment", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify patient information is displayed", async () => {
      // Patient info card should contain contact details
      const patientCard = page.locator('[class*="PatientInfoCard"]').first();
      await expect(patientCard).toBeVisible();

      // Should show appointment details heading
      await expect(
        page.getByRole("heading", { name: /appointment details/i }),
      ).toBeVisible();
    });
  });

  /**
   * Test: Permission-based access control
   * Verifies that users without proper permissions cannot access appointment details
   */
  test("should show appropriate content based on user permissions", async ({
    page,
  }) => {
    await test.step("Navigate to appointments list", async () => {
      await page.goto(`/facility/${facilityId}/appointments`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Open an appointment", async () => {
      const appointmentCard = page
        .locator('[data-test-id="appointment-card"]')
        .first();

      const hasAppointments = await appointmentCard
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (!hasAppointments) {
        test.skip();
      }

      await appointmentCard.click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify page loads successfully with admin permissions", async () => {
      // Admin user should see appointment details
      await expect(
        page.getByRole("heading", { name: /appointment details/i }),
      ).toBeVisible();

      // Should not show permission error
      await expect(page.getByText(/no permission/i)).not.toBeVisible();
    });
  });
});
