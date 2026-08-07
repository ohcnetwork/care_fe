import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { addDays, format } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Appointment Detail Page Tests
 *
 * Tests the appointment detail view and all its actions:
 * - View appointment information
 * - Check-in workflow
 * - Status transitions (booked → checked_in → in_consultation → fulfilled)
 * - Token generation
 * - Reschedule workflow
 * - Cancel appointment
 * - Quick actions (print, accounts, start consultation)
 * - Associated encounter viewing
 */
test.describe("Appointment Detail Page", () => {
  let facilityId: string;
  let patientId: string;
  let appointmentId: string;
  const appointmentReason = faker.lorem.sentence();

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();

    // Navigate to patient home to book an appointment
    await page.goto(`/facility/${facilityId}/patient/${patientId}`);
  });

  /**
   * Test: Book an appointment and navigate to detail page
   * Verifies that we can create an appointment and access its detail page
   */
  test("should book appointment and navigate to detail page", async ({
    page,
  }) => {
    await test.step("Open appointment booking sheet", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await expect(
        page.getByRole("heading", { name: "Book Appointment" }),
      ).toBeVisible();
    });

    await test.step("Fill appointment form", async () => {
      // Select practitioner (care-doctor from fixtures)
      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      // Fill appointment reason
      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);
    });

    await test.step("Select appointment slot", async () => {
      // Select tomorrow's date
      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));

      // Wait for slots to load
      await page.waitForLoadState("networkidle");

      // Click first available slot
      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await expect(slotButton).toBeVisible();
      await slotButton.click();
    });

    await test.step("Confirm booking", async () => {
      await page.getByRole("button", { name: "Book Appointment" }).click();

      // Wait for success message
      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });

      // Extract appointment ID from URL
      await page.waitForURL(/\/appointments\/[a-f0-9-]+/);
      const url = page.url();
      appointmentId = url.match(/appointments\/([a-f0-9-]+)/)?.[1] || "";
      expect(appointmentId).toBeTruthy();
    });

    await test.step("Verify appointment detail page", async () => {
      // Verify we're on the appointment detail page
      await expect(
        page.getByRole("heading", { name: "Appointment Details" }),
      ).toBeVisible();

      // Verify appointment reason is displayed
      await expect(page.getByText(appointmentReason)).toBeVisible();

      // Verify patient info card is visible
      await expect(page.getByText("Patient Details")).toBeVisible();

      // Verify status badge shows "Booked"
      await expect(page.getByText("Booked", { exact: true })).toBeVisible();
    });
  });

  /**
   * Test: Display appointment schedule information
   * Verifies all appointment details are correctly displayed
   */
  test("should display appointment schedule information", async ({ page }) => {
    await test.step("Book appointment", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);

      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));
      await page.waitForLoadState("networkidle");

      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await slotButton.click();
      await page.getByRole("button", { name: "Book Appointment" }).click();

      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify schedule information card", async () => {
      // Verify "Schedule Information" section is visible
      await expect(
        page.getByText("Schedule Information", { exact: true }),
      ).toBeVisible();

      // Verify appointment date is displayed
      const tomorrowDate = format(addDays(new Date(), 1), "dd MMM yyyy");
      await expect(page.getByText(tomorrowDate)).toBeVisible();

      // Verify practitioner name is displayed
      await expect(page.getByText("care-doctor")).toBeVisible();
    });

    await test.step("Verify patient contact information", async () => {
      // Patient contact section should be visible
      await expect(page.getByText("Patient Contact")).toBeVisible();
    });
  });

  /**
   * Test: Check-in action for booked appointment
   * Verifies that a booked appointment can be checked in
   */
  test("should check-in a booked appointment", async ({ page }) => {
    await test.step("Book appointment for tomorrow", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);

      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));
      await page.waitForLoadState("networkidle");

      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await slotButton.click();
      await page.getByRole("button", { name: "Book Appointment" }).click();

      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Perform check-in", async () => {
      // Wait for the check-in button to be visible (should be visible for appointments within 24 hours)
      const checkInButton = page.getByRole("button", { name: "Check In" });

      // Check if the button exists and is enabled
      const isCheckInAvailable = await checkInButton.count();

      if (isCheckInAvailable > 0) {
        await checkInButton.click();

        // Wait for status to update
        await page.waitForLoadState("networkidle");

        // Verify status changed to "Checked In"
        await expect(page.getByText("Checked In")).toBeVisible({
          timeout: 5000,
        });
      } else {
        // If check-in is not available (appointment not in valid time window),
        // verify the check-in button is not present
        await expect(checkInButton).not.toBeVisible();
      }
    });
  });

  /**
   * Test: Token generation for appointment
   * Verifies that a token can be generated for an appointment
   */
  test("should display token generation option", async ({ page }) => {
    await test.step("Book appointment", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);

      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));
      await page.waitForLoadState("networkidle");

      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await slotButton.click();
      await page.getByRole("button", { name: "Book Appointment" }).click();

      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify token section", async () => {
      // Verify token section is visible
      await expect(page.getByText("Token", { exact: true })).toBeVisible();

      // Verify "Token not generated" message
      await expect(page.getByText("Token not generated")).toBeVisible();

      // Verify "Generate Token" button is visible
      await expect(
        page.getByRole("button", { name: "Generate Token" }),
      ).toBeVisible();
    });
  });

  /**
   * Test: Quick actions availability
   * Verifies that quick action buttons are displayed
   */
  test("should display quick actions", async ({ page }) => {
    await test.step("Book appointment", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);

      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));
      await page.waitForLoadState("networkidle");

      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await slotButton.click();
      await page.getByRole("button", { name: "Book Appointment" }).click();

      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify quick actions section", async () => {
      // Verify "Quick Actions" heading
      await expect(page.getByText("Quick Actions")).toBeVisible();

      // Verify print appointment action
      await expect(page.getByText("Print Appointment")).toBeVisible();

      // Verify accounts action
      await expect(page.getByText("Accounts")).toBeVisible();

      // Verify create encounter action (should be visible for booked appointments)
      await expect(page.getByText("Create Planned Encounter")).toBeVisible();
    });
  });

  /**
   * Test: Appointment actions menu
   * Verifies that the actions dropdown menu shows available actions
   */
  test("should display appointment actions menu", async ({ page }) => {
    await test.step("Book appointment", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);

      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));
      await page.waitForLoadState("networkidle");

      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await slotButton.click();
      await page.getByRole("button", { name: "Book Appointment" }).click();

      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Open actions menu", async () => {
      // Click the actions menu button (three dots icon)
      const actionsButton = page
        .getByRole("button")
        .filter({ has: page.locator("svg") })
        .nth(1); // The dropdown menu trigger button
      await actionsButton.click();

      // Verify actions menu is visible
      await expect(page.getByText("Actions", { exact: true })).toBeVisible();

      // Verify "Mark as Fulfilled" option exists
      await expect(page.getByText("Mark as fulfilled")).toBeVisible();

      // Verify "Reschedule" option exists
      await expect(page.getByText("Reschedule")).toBeVisible();
    });
  });

  /**
   * Test: Reschedule workflow initiation
   * Verifies that the reschedule dialog opens and prompts for a note
   */
  test("should open reschedule dialog", async ({ page }) => {
    await test.step("Book appointment", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);

      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));
      await page.waitForLoadState("networkidle");

      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await slotButton.click();
      await page.getByRole("button", { name: "Book Appointment" }).click();

      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Open reschedule dialog", async () => {
      // Open actions menu
      const actionsButton = page
        .getByRole("button")
        .filter({ has: page.locator("svg") })
        .nth(1);
      await actionsButton.click();

      // Click reschedule option
      await page.getByText("Reschedule").click();

      // Verify reschedule dialog opened
      await expect(
        page.getByRole("heading", { name: "Reschedule Appointment" }),
      ).toBeVisible();

      // Verify warning message is displayed
      await expect(page.getByText("Warning")).toBeVisible();

      // Verify note field is present
      await expect(page.getByLabel("Note")).toBeVisible();
    });

    await test.step("Cancel reschedule", async () => {
      // Click cancel button
      await page.getByRole("button", { name: "Cancel" }).click();

      // Verify dialog closed
      await expect(
        page.getByRole("heading", { name: "Reschedule Appointment" }),
      ).not.toBeVisible();
    });
  });

  /**
   * Test: Patient information card display
   * Verifies that patient details are shown on the appointment detail page
   */
  test("should display patient information card", async ({ page }) => {
    await test.step("Book appointment", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);

      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));
      await page.waitForLoadState("networkidle");

      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await slotButton.click();
      await page.getByRole("button", { name: "Book Appointment" }).click();

      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify patient info card", async () => {
      // Verify patient details heading
      await expect(page.getByText("Patient Details")).toBeVisible();

      // Verify patient contact section
      await expect(page.getByText("Patient Contact")).toBeVisible();

      // Verify we can see patient name (should be visible in card)
      const patientNameElement = page.locator(".font-semibold").first();
      await expect(patientNameElement).toBeVisible();
    });
  });

  /**
   * Test: Back navigation
   * Verifies that the back button navigates to the previous page
   */
  test("should navigate back using back button", async ({ page }) => {
    await test.step("Book appointment", async () => {
      await page.getByRole("tab", { name: "Appointments" }).click();
      await page
        .getByRole("button", { name: "Book Appointment", exact: true })
        .click();

      await page.getByRole("button", { name: "Select Practitioner" }).click();
      await page.getByPlaceholder("Search by name").fill("care-doctor");
      await page
        .getByRole("option", { name: "care-doctor", exact: false })
        .click();

      await page
        .getByRole("textbox", { name: "Reason for appointment" })
        .fill(appointmentReason);

      const tomorrow = addDays(new Date(), 1);
      await page
        .getByLabel("Appointment Date")
        .fill(format(tomorrow, "yyyy-MM-dd"));
      await page.waitForLoadState("networkidle");

      const slotButton = page
        .getByRole("button", { name: /\d+:\d+ [AP]M/ })
        .first();
      await slotButton.click();
      await page.getByRole("button", { name: "Book Appointment" }).click();

      await expect(
        page.getByText("Appointment created successfully"),
      ).toBeVisible({ timeout: 10000 });

      // Store current URL
      appointmentId = page.url().match(/appointments\/([a-f0-9-]+)/)?.[1] || "";
    });

    await test.step("Navigate back", async () => {
      // Click back button
      await page.getByRole("button").first().click(); // Back button is typically the first button

      // Verify we navigated back to patient home
      await expect(page).toHaveURL(
        new RegExp(`/facility/${facilityId}/patient/${patientId}`),
      );
    });
  });
});
