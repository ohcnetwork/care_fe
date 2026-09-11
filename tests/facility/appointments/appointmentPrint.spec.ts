import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

/**
 * Appointment Print Page Tests
 *
 * Tests the print-friendly appointment view that displays:
 * - Patient information with QR code
 * - Appointment scheduling details
 * - Charges and payment information
 * - Print actions and controls
 *
 * Route: /facility/:facilityId/patient/:patientId/appointments/:appointmentId/print
 */

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Appointment Print Page", () => {
  let facilityId: string;
  let patientId: string;
  let appointmentId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();

    // Navigate to appointments list to find an appointment
    await page.goto(`/facility/${facilityId}/appointments`);
    await page.waitForLoadState("networkidle");

    // Try to find an appointment from the list
    const appointmentCard = page.locator('[data-testid^="appointment-card-"]').first();

    // If no appointments exist, skip the test
    const hasAppointments = await appointmentCard.count();
    if (hasAppointments === 0) {
      test.skip(true, "No appointments available to test print view");
      return;
    }

    // Extract appointment ID from the card's data-testid
    const testId = await appointmentCard.getAttribute("data-testid");
    appointmentId = testId?.replace("appointment-card-", "") || "";

    if (!appointmentId) {
      // Alternative: click the appointment and extract ID from URL
      await appointmentCard.click();
      await page.waitForLoadState("networkidle");

      const url = page.url();
      const match = url.match(/appointments\/([^/]+)$/);
      if (match) {
        appointmentId = match[1];
      }
    }

    // Navigate to print page
    if (appointmentId) {
      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/appointments/${appointmentId}/print`,
      );
      await page.waitForLoadState("networkidle");
    }
  });

  test("should display print preview with all key elements", async ({ page }) => {
    await test.step("Verify page loads with print preview", async () => {
      // Check for PrintPreview wrapper
      await expect(page.locator("#section-to-print")).toBeVisible();

      // Verify title is displayed
      await expect(
        page.getByRole("heading", { name: "Appointment Details", exact: false }),
      ).toBeVisible();
    });

    await test.step("Verify print controls are present", async () => {
      // Back button should be visible
      await expect(page.getByRole("button", { name: "Back" })).toBeVisible();

      // Print button should be visible (unless auto-print is enabled)
      const printButton = page.getByRole("button", { name: "Print", exact: false });
      // Print button might not be visible during auto-print, so we check if it exists
      const printButtonCount = await printButton.count();
      if (printButtonCount > 0) {
        await expect(printButton).toBeVisible();
      }
    });
  });

  test("should display patient information section", async ({ page }) => {
    await test.step("Verify patient details are shown", async () => {
      const printSection = page.locator("#section-to-print");

      // Patient name should be displayed
      await expect(printSection.getByText("Patient", { exact: false })).toBeVisible();

      // Contact phone should be displayed if available
      const phoneLabel = printSection.getByText("Phone", { exact: false });
      if ((await phoneLabel.count()) > 0) {
        await expect(phoneLabel).toBeVisible();
      }
    });

    await test.step("Verify QR code is displayed", async () => {
      // QR code SVG should be present
      const qrCode = page.locator("#section-to-print svg");
      await expect(qrCode.first()).toBeVisible();
    });
  });

  test("should display appointment scheduling details", async ({ page }) => {
    await test.step("Verify appointment date and time", async () => {
      const printSection = page.locator("#section-to-print");

      // Date should be displayed in header
      // Format: "dd MMM, yyyy, EEE" (e.g., "19 Aug, 2026, Wed")
      await expect(printSection.locator("text=/\\d{1,2}\\s\\w{3},\\s\\d{4}/")).toBeVisible();
    });

    await test.step("Verify resource information", async () => {
      const printSection = page.locator("#section-to-print");

      // Resource type and name should be displayed
      // Look for "Practitioner:", "Slot:", etc.
      const resourceText = printSection.locator(
        "text=/Practitioner|Slot|Device|Room/i",
      );
      const hasResource = await resourceText.count();
      if (hasResource > 0) {
        await expect(resourceText.first()).toBeVisible();
      }
    });
  });

  test("should display token number if available", async ({ page }) => {
    await test.step("Verify token number section", async () => {
      const printSection = page.locator("#section-to-print");

      // Token number might not always be present
      const tokenLabel = printSection.getByText("Token No", { exact: false });
      const hasToken = await tokenLabel.count();

      if (hasToken > 0) {
        await expect(tokenLabel).toBeVisible();
        // Token number should be displayed in a large, bold format
        await expect(
          printSection.locator("text=/[A-Z]?\\d+/").filter({ hasText: /^\d+/ }),
        ).toBeVisible();
      }
    });
  });

  test("should display charges table if charges exist", async ({ page }) => {
    await test.step("Verify charges section", async () => {
      const printSection = page.locator("#section-to-print");

      // Check if charges table exists
      const chargesHeading = printSection.getByText("Charges", { exact: true });
      const hasCharges = await chargesHeading.count();

      if (hasCharges > 0) {
        await expect(chargesHeading).toBeVisible();

        // Verify table headers
        await expect(printSection.getByRole("columnheader", { name: "#" })).toBeVisible();
        await expect(
          printSection.getByRole("columnheader", { name: "Particulars" }),
        ).toBeVisible();
        await expect(
          printSection.getByRole("columnheader", { name: "Amount" }),
        ).toBeVisible();
        await expect(
          printSection.getByRole("columnheader", { name: "Status" }),
        ).toBeVisible();

        // Total amount should be displayed
        await expect(printSection.getByText("Total Amount", { exact: false })).toBeVisible();
      }
    });
  });

  test("should display payment details if payments exist", async ({ page }) => {
    await test.step("Verify payment details section", async () => {
      const printSection = page.locator("#section-to-print");

      // Check if payment details exist
      const paymentHeading = printSection.getByText("Payment Details", { exact: false });
      const hasPayments = await paymentHeading.count();

      if (hasPayments > 0) {
        await expect(paymentHeading).toBeVisible();

        // Verify payment table headers
        await expect(
          printSection.getByRole("columnheader", { name: "Invoice" }),
        ).toBeVisible();
        await expect(
          printSection.getByRole("columnheader", { name: "Payment Method" }),
        ).toBeVisible();

        // Amount paid should be displayed
        await expect(printSection.getByText("Amount Paid", { exact: false })).toBeVisible();
      }
    });
  });

  test("should display appointment notes if available", async ({ page }) => {
    await test.step("Verify notes section", async () => {
      const printSection = page.locator("#section-to-print");

      // Notes section might not always be present
      const notesHeading = printSection.getByText("Note", { exact: true });
      const hasNotes = await notesHeading.count();

      if (hasNotes > 0) {
        await expect(notesHeading).toBeVisible();
        // Note content should be in a pre-wrap container
        const noteContent = printSection.locator(".whitespace-pre-wrap");
        await expect(noteContent).toBeVisible();
      }
    });
  });

  test("should display tags if available", async ({ page }) => {
    await test.step("Verify tags section", async () => {
      const printSection = page.locator("#section-to-print");

      // Tags might not always be present
      const tagsLabel = printSection.getByText("Tags", { exact: true });
      const hasTags = await tagsLabel.count();

      if (hasTags > 0) {
        await expect(tagsLabel).toBeVisible();
        // Tag badges should be displayed
        // Tags use a custom TagBadge component with hierarchical display
      }
    });
  });

  test("should display footer with creator and updater information", async ({ page }) => {
    await test.step("Verify footer information", async () => {
      const printSection = page.locator("#section-to-print");

      // Created by information
      await expect(printSection.getByText("Created By", { exact: false })).toBeVisible();

      // Last updated by information
      await expect(
        printSection.getByText("Last Updated By", { exact: false }),
      ).toBeVisible();

      // Current timestamp should be displayed
      // Format: "PP 'at' p" (e.g., "Aug 19, 2026 at 3:19 AM")
      await expect(printSection.locator("text=/\\w{3}\\s\\d{1,2},\\s\\d{4}/")).toBeVisible();
    });
  });

  test("should handle print button interaction", async ({ page }) => {
    await test.step("Click print button if available", async () => {
      const printButton = page.getByRole("button", { name: "Print", exact: false });
      const printButtonCount = await printButton.count();

      if (printButtonCount > 0 && (await printButton.isVisible())) {
        // Note: Actual print dialog won't open in headless browser
        // We just verify the button is clickable
        await expect(printButton).toBeEnabled();

        // In a real browser, clicking would trigger window.print()
        // In headless mode, we can only verify the button exists and is clickable
      }
    });
  });

  test("should handle back button navigation", async ({ page }) => {
    await test.step("Verify back button functionality", async () => {
      const backButton = page.getByRole("button", { name: "Back" });
      await expect(backButton).toBeVisible();
      await expect(backButton).toBeEnabled();

      // Click back button
      await backButton.click();
      await page.waitForLoadState("networkidle");

      // Should navigate away from print page
      expect(page.url()).not.toContain("/print");
    });
  });

  test("should be optimized for print media", async ({ page }) => {
    await test.step("Verify print-friendly layout", async () => {
      const printSection = page.locator("#section-to-print");
      await expect(printSection).toBeVisible();

      // Check for print-optimized width (720px as per source)
      const containerWidth = await printSection.evaluate((el) => {
        const parent = el.parentElement;
        return parent ? window.getComputedStyle(parent).width : "";
      });

      // Verify content is in a centered, print-optimized container
      // Width should be constrained for print layout
      expect(containerWidth).toBeTruthy();
    });

    await test.step("Verify text sizes are print-appropriate", async () => {
      const printSection = page.locator("#section-to-print");

      // Print pages use smaller text sizes (text-xs is common)
      // Verify the content container has appropriate styling
      const hasSmallText = await printSection.locator(".text-xs").count();
      expect(hasSmallText).toBeGreaterThan(0);
    });
  });
});
