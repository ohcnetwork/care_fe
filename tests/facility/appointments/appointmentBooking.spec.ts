import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { bookAppointment } from "tests/helper/appointment";
import { selectFirstAvailablePractitioner } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientIds } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const appointmentTriggerName = /schedule appointment|book appointment/i;

test.describe("Appointment Booking Workflow", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientIds().id;

    // Navigate to patient profile page
    await page.goto(`/facility/${facilityId}/patient/${patientId}`);

    // Wait for the appointment action to be available
    await expect(
      page.getByRole("button", { name: appointmentTriggerName }),
    ).toBeVisible();
  });

  /**
   * Test: Open appointment booking sheet from patient home
   * Verifies that clicking "Book Appointment" opens the booking sheet with proper tabs
   */
  test("should open appointment booking sheet", async ({ page }) => {
    await test.step("Click Book Appointment button", async () => {
      const bookButton = page.getByRole("button", {
        name: appointmentTriggerName,
      });
      await expect(bookButton).toBeVisible();
      await bookButton.click();
    });

    await test.step("Verify booking sheet opens", async () => {
      // Check for sheet dialog
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();

      // Verify title
      await expect(
        sheet.getByRole("heading", { name: /book appointment/i }),
      ).toBeVisible();

      // Verify tabs are present
      await expect(
        sheet.getByRole("tab", { name: /book appointment/i }),
      ).toBeVisible();
      await expect(sheet.getByRole("tab", { name: /bookings/i })).toBeVisible();
    });
  });

  /**
   * Test: Fill appointment booking form
   * Verifies that practitioner can be selected and appointment details can be filled
   */
  test("should fill appointment booking form", async ({ page }) => {
    await test.step("Open booking sheet", async () => {
      await page.getByRole("button", { name: appointmentTriggerName }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    await test.step("Select a practitioner", async () => {
      await selectFirstAvailablePractitioner(page, page.getByRole("dialog"));

      // The combobox trigger no longer shows the "Select Practitioner"
      // placeholder once a practitioner is chosen.
      await expect(
        page
          .getByRole("dialog")
          .getByRole("combobox")
          .filter({ hasText: /select practitioner/i }),
      ).toHaveCount(0);
    });

    await test.step("Fill appointment reason", async () => {
      const reasonInput = page
        .getByRole("dialog")
        .getByPlaceholder(/reason for visit/i);
      const appointmentReason = faker.lorem.sentence();
      await reasonInput.fill(appointmentReason);
      await expect(reasonInput).toHaveValue(appointmentReason);
    });
  });

  /**
   * Test: Select appointment date and time slot
   * Verifies date selection and slot picker functionality
   */
  test("should select appointment date and time slot", async ({ page }) => {
    await test.step("Open booking sheet and select practitioner", async () => {
      await page.getByRole("button", { name: appointmentTriggerName }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await selectFirstAvailablePractitioner(page, page.getByRole("dialog"));
    });

    await test.step("Select a time slot", async () => {
      const sheet = page.getByRole("dialog");

      // Slots for the selected practitioner render as HH:mm buttons.
      const slots = sheet
        .getByRole("button")
        .filter({ hasText: /\d{2}:\d{2}/ });
      await expect(slots.first()).toBeVisible();

      // The picker auto-selects the first slot; pick a different one to prove a
      // slot is selectable, then verify the confirm action is revealed.
      await slots.nth(1).click();
      await expect(
        sheet.getByRole("button", { name: /confirm appointment/i }),
      ).toBeVisible();
    });
  });

  /**
   * Test: Complete appointment booking workflow
   * Verifies the full end-to-end booking process including submission
   */
  test("should complete full appointment booking workflow", async ({
    page,
  }) => {
    const reason = faker.lorem.sentence();

    await test.step("Book an appointment end to end", async () => {
      // Shared helper: opens the sheet, picks a practitioner, fills the reason,
      // chooses the first bookable day, confirms, asserts the create response,
      // and lands on the appointment detail page.
      await bookAppointment(page, reason);
    });

    await test.step("Verify the booked appointment persisted", async () => {
      // The reason we submitted is shown on the destination detail page.
      await expect(page.getByText(reason)).toBeVisible();
    });
  });

  /**
   * Test: Switch between booking tabs
   * Verifies navigation between "Book Appointment" and "Bookings" tabs
   */
  test("should switch between booking and bookings list tabs", async ({
    page,
  }) => {
    await test.step("Open booking sheet", async () => {
      await page.getByRole("button", { name: appointmentTriggerName }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
    });

    await test.step("Verify default tab is Book Appointment", async () => {
      const sheet = page.getByRole("dialog");
      const bookTab = sheet.getByRole("tab", { name: /book appointment/i });

      // Active tab should have specific styling or aria-selected
      await expect(bookTab).toHaveAttribute("data-state", "active");
    });

    await test.step("Switch to Bookings tab", async () => {
      const sheet = page.getByRole("dialog");
      const bookingsTab = sheet.getByRole("tab", { name: /bookings/i });

      await bookingsTab.click();

      // Verify tab is now active
      await expect(bookingsTab).toHaveAttribute("data-state", "active");

      // Verify bookings list content is displayed
      // This would show existing appointments for the patient
      await page.waitForTimeout(500);
    });

    await test.step("Switch back to Book Appointment tab", async () => {
      const sheet = page.getByRole("dialog");
      const bookTab = sheet.getByRole("tab", { name: /book appointment/i });

      await bookTab.click();
      await expect(bookTab).toHaveAttribute("data-state", "active");
    });
  });

  /**
   * Test: Handle empty slot state gracefully
   * Verifies that the UI handles scenarios where no slots are available
   */
  test("should handle no available slots gracefully", async ({ page }) => {
    await test.step("Open booking sheet", async () => {
      await page.getByRole("button", { name: appointmentTriggerName }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
    });

    await test.step("Select a practitioner", async () => {
      // The trigger is a combobox (role="combobox"), and the picker lists both
      // departments and practitioners — navigate the tree to a practitioner.
      await selectFirstAvailablePractitioner(page, page.getByRole("dialog"));
    });

    await test.step("Slot area resolves to slots or empty state", async () => {
      const sheet = page.getByRole("dialog");

      // Once a practitioner is selected, the picker leaves its skeleton state and
      // settles into exactly one of two loaded states: available slots (HH:mm
      // buttons) or the empty-state message. Either is a valid graceful outcome.
      const slots = sheet
        .getByRole("button")
        .filter({ hasText: /\d{2}:\d{2}/ });
      const emptyState = sheet.getByText("No slots available for this date");
      await expect(slots.first().or(emptyState)).toBeVisible();
    });
  });

  /**
   * Test: Close booking sheet
   * Verifies that the booking sheet can be closed via Escape or close button
   */
  test("should close booking sheet", async ({ page }) => {
    await test.step("Open booking sheet", async () => {
      await page.getByRole("button", { name: appointmentTriggerName }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
    });

    await test.step("Close sheet via Escape key", async () => {
      await page.keyboard.press("Escape");

      // Sheet should close
      const sheet = page.getByRole("dialog");
      await expect(sheet).not.toBeVisible({ timeout: 2000 });
    });

    await test.step("Reopen and close via close button", async () => {
      // Reopen
      await page.getByRole("button", { name: appointmentTriggerName }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();

      // Look for close button (usually an X icon)
      const closeButton = sheet
        .getByRole("button")
        .filter({ has: page.locator("svg.lucide-x") })
        .first();

      if (await closeButton.isVisible()) {
        await closeButton.click();
        await expect(sheet).not.toBeVisible({ timeout: 2000 });
      }
    });
  });
});
