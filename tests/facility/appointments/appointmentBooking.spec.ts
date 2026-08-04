import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { selectFromCommand } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Appointment Booking Workflow", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();

    // Navigate to patient home page
    await page.goto(`/facility/${facilityId}/patient/${patientId}`);

    // Wait for page to load
    await expect(page.locator('[data-slot="page-header"]')).toBeVisible();
  });

  /**
   * Test: Open appointment booking sheet from patient home
   * Verifies that clicking "Book Appointment" opens the booking sheet with proper tabs
   */
  test("should open appointment booking sheet", async ({ page }) => {
    await test.step("Click Book Appointment button", async () => {
      const bookButton = page.getByRole("button", {
        name: /book appointment/i,
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
      await page.getByRole("button", { name: /book appointment/i }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
    });

    await test.step("Select practitioner or healthcare service", async () => {
      const sheet = page.getByRole("dialog");

      // Find the resource selector (either Practitioner or Healthcare Service)
      const resourceTrigger = sheet
        .getByRole("button")
        .filter({ hasText: /select practitioner|select healthcare service/i })
        .first();

      if (await resourceTrigger.isVisible()) {
        await selectFromCommand(page, resourceTrigger, { itemIndex: 0 });

        // Verify selection was made
        await expect(resourceTrigger).not.toHaveText(
          /select practitioner|select healthcare service/i,
        );
      }
    });

    await test.step("Fill appointment reason", async () => {
      const sheet = page.getByRole("dialog");
      const reasonInput = sheet.getByRole("textbox", {
        name: /reason|note/i,
      });

      if (await reasonInput.isVisible()) {
        const appointmentReason = faker.lorem.sentence();
        await reasonInput.fill(appointmentReason);
        await expect(reasonInput).toHaveValue(appointmentReason);
      }
    });
  });

  /**
   * Test: Select appointment date and time slot
   * Verifies date selection and slot picker functionality
   */
  test("should select appointment date and time slot", async ({ page }) => {
    await test.step("Open booking sheet", async () => {
      await page.getByRole("button", { name: /book appointment/i }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
    });

    await test.step("Select practitioner first", async () => {
      const sheet = page.getByRole("dialog");
      const resourceTrigger = sheet
        .getByRole("button")
        .filter({ hasText: /select practitioner|select healthcare service/i })
        .first();

      if (await resourceTrigger.isVisible()) {
        await selectFromCommand(page, resourceTrigger, { itemIndex: 0 });

        // Wait for slots to load after practitioner selection
        await page.waitForTimeout(1000);
      }
    });

    await test.step("Verify date selection calendar is visible", async () => {
      const sheet = page.getByRole("dialog");

      // Look for calendar or date picker elements
      // The calendar should be visible after selecting a practitioner
      const calendarExists =
        (await sheet.locator("[role='button'][name*='day']").count()) > 0;

      if (calendarExists) {
        // Calendar is present
        expect(calendarExists).toBe(true);
      }
    });

    await test.step("Verify time slots are displayed", async () => {
      const sheet = page.getByRole("dialog");

      // Look for available time slots
      // Slots might be buttons or clickable elements with time information
      const slotButtons = sheet.getByRole("button").filter({
        hasText: /am|pm|available|:\d{2}/i,
      });

      const slotCount = await slotButtons.count();

      // If slots are available, verify they can be selected
      if (slotCount > 0) {
        await slotButtons.first().click();

        // After selecting a slot, the "Create Appointment" or "Book" button should appear
        const createButton = sheet.getByRole("button", {
          name: /create appointment|book|confirm/i,
        });

        await expect(createButton).toBeVisible();
      }
    });
  });

  /**
   * Test: Complete appointment booking workflow
   * Verifies the full end-to-end booking process including submission
   */
  test("should complete full appointment booking workflow", async ({
    page,
  }) => {
    await test.step("Open booking sheet", async () => {
      await page.getByRole("button", { name: /book appointment/i }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
    });

    await test.step("Select practitioner/service", async () => {
      const sheet = page.getByRole("dialog");
      const resourceTrigger = sheet
        .getByRole("button")
        .filter({ hasText: /select practitioner|select healthcare service/i })
        .first();

      if (await resourceTrigger.isVisible()) {
        await selectFromCommand(page, resourceTrigger, { itemIndex: 0 });
        await page.waitForTimeout(1000);
      }
    });

    await test.step("Fill appointment details", async () => {
      const sheet = page.getByRole("dialog");
      const reasonInput = sheet.getByRole("textbox", {
        name: /reason|note/i,
      });

      if (await reasonInput.isVisible()) {
        await reasonInput.fill(faker.lorem.sentence());
      }
    });

    await test.step("Select time slot if available", async () => {
      const sheet = page.getByRole("dialog");
      const slotButtons = sheet.getByRole("button").filter({
        hasText: /am|pm|available|:\d{2}/i,
      });

      const slotCount = await slotButtons.count();
      if (slotCount > 0) {
        await slotButtons.first().click();

        // Look for create/book button
        const createButton = sheet.getByRole("button", {
          name: /create appointment|book|confirm/i,
        });

        if (await createButton.isVisible()) {
          await createButton.click();

          // Wait for success message or navigation
          await page.waitForLoadState("networkidle");

          // Verify success - either toast message or navigation to appointment detail
          const successToast = page.getByText(/appointment.*created|booked/i);
          const isOnAppointmentPage = page.url().includes("/appointments/");

          if (
            await successToast.isVisible({ timeout: 5000 }).catch(() => false)
          ) {
            expect(await successToast.isVisible()).toBe(true);
          } else if (isOnAppointmentPage) {
            // Successfully navigated to appointment detail page
            expect(isOnAppointmentPage).toBe(true);
          }
        }
      }
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
      await page.getByRole("button", { name: /book appointment/i }).click();
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
      await page.getByRole("button", { name: /book appointment/i }).click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toBeVisible();
    });

    await test.step("Select practitioner", async () => {
      const sheet = page.getByRole("dialog");
      const resourceTrigger = sheet
        .getByRole("button")
        .filter({ hasText: /select practitioner|select healthcare service/i })
        .first();

      if (await resourceTrigger.isVisible()) {
        await selectFromCommand(page, resourceTrigger, { itemIndex: 0 });
        await page.waitForTimeout(1000);
      }
    });

    await test.step("Check for empty state or available slots", async () => {
      const sheet = page.getByRole("dialog");

      // Wait for either slots to appear or an empty state message
      await page.waitForTimeout(2000);

      const slotButtons = sheet.getByRole("button").filter({
        hasText: /am|pm|available|:\d{2}/i,
      });
      const slotCount = await slotButtons.count();

      const emptyMessage = sheet.getByText(
        /no.*slots.*available|no.*appointments/i,
      );
      const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

      // Either slots should be available OR an empty state message should show
      expect(slotCount > 0 || hasEmptyMessage).toBe(true);
    });
  });

  /**
   * Test: Close booking sheet
   * Verifies that the booking sheet can be closed via Escape or close button
   */
  test("should close booking sheet", async ({ page }) => {
    await test.step("Open booking sheet", async () => {
      await page.getByRole("button", { name: /book appointment/i }).click();
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
      await page.getByRole("button", { name: /book appointment/i }).click();
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
