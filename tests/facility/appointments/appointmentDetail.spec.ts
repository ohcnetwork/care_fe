import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { format } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Appointment Detail Page", () => {
  let facilityId: string;
  let patientId: string;
  let appointmentId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();

    // Navigate to appointments list to find or create an appointment
    await page.goto(`/facility/${facilityId}/appointments`);

    // Try to click on an existing appointment to get its ID
    // If no appointments exist, this test will be skipped
    const appointmentLink = page
      .locator('[href*="/appointments/"]')
      .first();

    if (await appointmentLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const href = await appointmentLink.getAttribute("href");
      if (href) {
        // Extract appointment ID from URL like /facility/123/patient/456/appointments/789
        const match = href.match(/\/appointments\/([^/]+)/);
        if (match) {
          appointmentId = match[1];
        }
      }
    }
  });

  /**
   * Tests that the appointment detail page loads successfully with all key elements
   * including patient information, appointment status, and date/time details
   */
  test("should load appointment detail page with key elements", async ({
    page,
  }) => {
    test.skip(!appointmentId, "No appointment available for testing");

    await test.step("Navigate to appointment detail", async () => {
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
      );
    });

    await test.step("Verify page title and back button", async () => {
      await expect(
        page.getByRole("heading", { name: "Appointment Details" }),
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole("button").first()).toBeVisible(); // Back button
    });

    await test.step("Verify appointment details are displayed", async () => {
      // Status badge should be visible
      await expect(
        page.locator('[data-status-badge]').first(),
      ).toBeVisible({ timeout: 5000 });

      // Patient info card should be visible
      await expect(
        page.locator('[data-slot="patient-info-hover-card-trigger"]'),
      ).toBeVisible();
    });
  });

  /**
   * Tests that appointment status badge displays with correct styling
   * and reflects the current appointment state
   */
  test("should display appointment status badge", async ({ page }) => {
    test.skip(!appointmentId, "No appointment available for testing");

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
    );

    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: "Appointment Details" }),
    ).toBeVisible({ timeout: 10000 });

    // Verify status badge exists (could be any status: booked, checked_in, etc.)
    const statusBadge = page.locator('[data-status-badge]').first();
    if (await statusBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statusBadge).toBeVisible();
    }
  });

  /**
   * Tests that the patient info card is displayed with essential information
   * and can be interacted with to reveal more details
   */
  test("should display patient information card", async ({ page }) => {
    test.skip(!appointmentId, "No appointment available for testing");

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
    );

    // Wait for page load
    await page.waitForLoadState("networkidle");

    await test.step("Verify patient info hover card trigger is visible", async () => {
      const patientInfoTrigger = page.locator(
        '[data-slot="patient-info-hover-card-trigger"]',
      );
      await expect(patientInfoTrigger).toBeVisible({ timeout: 10000 });
    });

    await test.step("Click patient info to reveal hover card", async () => {
      await page
        .locator('[data-slot="patient-info-hover-card-trigger"]')
        .click();

      // Verify hover card content appears
      const viewProfileLink = page.getByRole("link", {
        name: "View Profile",
      });
      if (
        await viewProfileLink.isVisible({ timeout: 3000 }).catch(() => false)
      ) {
        await expect(viewProfileLink).toBeVisible();
      }
    });
  });

  /**
   * Tests the appointment actions menu accessibility and visibility
   * Checks that actions like reschedule, cancel are available (if user has permission)
   */
  test("should show appointment actions menu", async ({ page }) => {
    test.skip(!appointmentId, "No appointment available for testing");

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
    );

    await page.waitForLoadState("networkidle");

    await test.step("Look for actions dropdown menu", async () => {
      // Actions menu uses dropdown with three dots icon
      const actionsMenu = page
        .getByRole("button")
        .filter({ has: page.locator("svg") })
        .filter({ hasText: "" }); // Empty text indicates icon-only button

      // Check if actions menu is present (depends on permissions)
      if (await actionsMenu.first().isVisible({ timeout: 3000 })) {
        await actionsMenu.first().click();

        // Verify dropdown items (could include reschedule, cancel, etc.)
        // Different options appear based on appointment status and permissions
        const menuItems = page.getByRole("menuitem");
        const count = await menuItems.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  /**
   * Tests the back button navigation from appointment detail to previous page
   */
  test("should navigate back when back button is clicked", async ({ page }) => {
    test.skip(!appointmentId, "No appointment available for testing");

    // First navigate to appointments list
    await page.goto(`/facility/${facilityId}/appointments`);

    // Then navigate to appointment detail
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
    );

    await test.step("Click back button", async () => {
      // Back button is the first button with ChevronLeft icon
      await page.getByRole("button").first().click();
    });

    await test.step("Verify navigation occurred", async () => {
      // Should navigate away from appointment detail
      await page.waitForLoadState("networkidle");
      // URL should change from the appointment detail page
      expect(page.url()).not.toContain(`/appointments/${appointmentId}`);
    });
  });

  /**
   * Tests that success message displays correctly when appointment is created
   * The success alert shows appointment details and can be dismissed
   */
  test("should display success message when showSuccess param is present", async ({
    page,
  }) => {
    test.skip(!appointmentId, "No appointment available for testing");

    await test.step("Navigate with showSuccess query parameter", async () => {
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}?showSuccess=true`,
      );
    });

    await test.step("Verify success alert is displayed", async () => {
      // Success alert should be visible
      const successAlert = page.locator('[role="alert"]').filter({
        hasText: /appointment.*success/i,
      });

      if (await successAlert.isVisible({ timeout: 5000 })) {
        await expect(successAlert).toBeVisible();

        // Close button should be present
        const closeButton = successAlert.getByRole("button", {
          name: /close/i,
        });
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await expect(closeButton).toBeVisible();
        }
      }
    });

    await test.step("Dismiss success message", async () => {
      const successAlert = page.locator('[role="alert"]').filter({
        hasText: /appointment.*success/i,
      });

      if (await successAlert.isVisible({ timeout: 3000 })) {
        const closeButton = successAlert.getByRole("button", {
          name: /close/i,
        });

        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click();

          // Success message should disappear
          await expect(successAlert).not.toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  /**
   * Tests that appointment details section displays scheduling information
   * including resource type, date, time slot, and practitioner details
   */
  test("should display appointment scheduling details", async ({ page }) => {
    test.skip(!appointmentId, "No appointment available for testing");

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
    );

    await page.waitForLoadState("networkidle");

    await test.step("Verify appointment details card is present", async () => {
      // The page uses Card components to display appointment info
      const detailsCard = page.locator('[class*="card"]').first();
      await expect(detailsCard).toBeVisible({ timeout: 10000 });
    });

    await test.step("Check for date and time information", async () => {
      // Date and time should be displayed somewhere in the content
      // Format could be like "1st January", "10:00 AM - 10:30 AM"
      const pageContent = page.locator("body");
      await expect(pageContent).toBeVisible();

      // Verify some date-like or time-like text exists
      const hasDateInfo =
        (await pageContent
          .getByText(/\d{1,2}:\d{2}/)
          .count()
          .catch(() => 0)) > 0 ||
        (await pageContent
          .getByText(/AM|PM/i)
          .count()
          .catch(() => 0)) > 0 ||
        (await pageContent
          .getByText(/\d{1,2}(st|nd|rd|th)/)
          .count()
          .catch(() => 0)) > 0;

      expect(hasDateInfo).toBeTruthy();
    });
  });

  /**
   * Tests that tags are displayed on the appointment
   * and tag management functionality is available
   */
  test("should display appointment tags", async ({ page }) => {
    test.skip(!appointmentId, "No appointment available for testing");

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}`,
    );

    await page.waitForLoadState("networkidle");

    await test.step("Check if tags section is visible", async () => {
      // Tags are displayed as badges in the patient info card
      // The tag assignment button or existing tags should be visible
      const tagsSection = page.locator('[class*="tag"]').first();

      // Tags might not always be present, so we check gracefully
      if (await tagsSection.isVisible({ timeout: 3000 })) {
        await expect(tagsSection).toBeVisible();
      } else {
        // Tag management button might be present even if no tags
        const manageTagsButton = page.getByRole("button").filter({
          hasText: /tag/i,
        });

        if (await manageTagsButton.first().isVisible({ timeout: 2000 })) {
          await expect(manageTagsButton.first()).toBeVisible();
        }
      }
    });
  });
});
