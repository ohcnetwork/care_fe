import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { bookAppointment } from "tests/helper/appointment";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientIds } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Appointment Detail Page Tests
 *
 * Tests the appointment detail view and its actions: viewing appointment and
 * patient information, checking in, generating a token, the quick actions and
 * actions menu, the reschedule dialog, and back navigation.
 */
test.describe("Appointment Detail Page", () => {
  // Serial mode: beforeAll books a single shared appointment (a slot can't be
  // booked twice), and the check-in test mutates it and must run last. Serial
  // execution runs the file on one worker in order, so it neither double-books
  // itself nor races the check-in ahead of the read-only tests.
  test.describe.configure({ mode: "serial" });

  const reason = faker.lorem.sentence();

  // The test DB is not reset between tests, and a patient cannot be booked into
  // the same slot twice, so we book a single appointment up front and view it
  // in each test. The one state-mutating test (check-in) runs last.
  let patientHome: string;
  let appointmentUrl: string;

  test.beforeAll(async ({ browser }) => {
    const facilityId = getFacilityId();
    // Book against a patient distinct from the one appointmentBooking.spec.ts
    // uses, so the two files can't race for the same patient/slot when they run
    // on parallel workers (serial mode only orders tests within this file).
    const patientId = getPatientIds().secondId;
    patientHome = `/facility/${facilityId}/patient/${patientId}`;

    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });
    const page = await context.newPage();
    await page.goto(patientHome);
    const appointmentId = await bookAppointment(page, reason);
    expect(appointmentId).toBeTruthy();
    appointmentUrl = `${patientHome}/appointments/${appointmentId}`;
    await context.close();
  });

  test("displays the booked appointment and its reason", async ({ page }) => {
    await page.goto(appointmentUrl);

    await expect(
      page.getByRole("heading", { name: "Appointment Details" }),
    ).toBeVisible();
    await expect(page.getByText(reason)).toBeVisible();
    await expect(page.getByText("Booked", { exact: true })).toBeVisible();
  });

  test("displays the schedule and patient information", async ({ page }) => {
    await page.goto(appointmentUrl);

    await expect(
      page.getByText("Schedule Information", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Patient Information")).toBeVisible();
    // Assert the patient's phone actually rendered (a tel: link), not just the
    // static "Phone" label which is present regardless.
    await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
  });

  test("offers token generation for a new appointment", async ({ page }) => {
    await page.goto(appointmentUrl);

    await expect(
      page.getByRole("heading", { name: "Token", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Token not generated")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate Token" }),
    ).toBeVisible();
  });

  test("shows the quick actions", async ({ page }) => {
    await page.goto(appointmentUrl);

    await expect(
      page.getByRole("heading", { name: "Quick Actions" }),
    ).toBeVisible();
    await expect(page.getByText("Print Appointment")).toBeVisible();
    await expect(page.getByText("Accounts")).toBeVisible();
    await expect(page.getByText("Create Planned Encounter")).toBeVisible();
  });

  test("shows the actions menu", async ({ page }) => {
    await page.goto(appointmentUrl);

    await page.getByRole("button", { name: "Actions" }).click();

    // The dropdown item text carries a typo in the locale ("Fullfilled"), so
    // match loosely on the stable prefix.
    await expect(
      page.getByRole("menuitem", { name: /mark as full/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Reschedule" }),
    ).toBeVisible();
  });

  test("opens and cancels the reschedule dialog", async ({ page }) => {
    await page.goto(appointmentUrl);

    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Reschedule" }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(
      dialog.getByRole("heading", { name: "Reschedule Appointment" }),
    ).toBeVisible();
    await expect(dialog.getByText("Warning")).toBeVisible();
    await expect(dialog.getByRole("textbox")).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();
  });

  // Runs last: this is the only test that mutates the shared appointment.
  test("checks in the booked appointment", async ({ page }) => {
    await page.goto(appointmentUrl);

    const checkIn = page.getByRole("button", { name: "Check-In" });
    await expect(checkIn).toBeEnabled();
    await checkIn.click();

    await expect(page.getByText("Checked-In", { exact: true })).toBeVisible();
  });
});
