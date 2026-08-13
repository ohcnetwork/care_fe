import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

// Display name of the seeded `care-doctor` practitioner. The resource picker
// fuzzy-matches on the rendered name, not the username, so we search by name.
const PRACTITIONER_NAME = "Gagan";

/**
 * Books an appointment for the patient currently shown on the page and returns
 * the created appointment's id once the detail page has loaded.
 *
 * The flow mirrors what a user does: open the booking sheet, pick a
 * practitioner, add a reason, choose the first available date (the slot picker
 * auto-selects the first free slot), and confirm.
 */
async function bookAppointment(page: Page, reason: string): Promise<string> {
  await page.getByRole("button", { name: "Schedule Appointment" }).click();

  const sheet = page.getByRole("dialog", { name: "Book Appointment" });
  await expect(sheet).toBeVisible();

  // Select a practitioner from the resource selector.
  await sheet.getByRole("combobox").click();
  const practitionerPicker = page.getByRole("dialog").last();
  // Widen the search beyond the current user's own departments so the seeded
  // practitioner (in another department) is reachable.
  await practitionerPicker.getByRole("button", { name: "My Dept." }).click();
  await practitionerPicker
    .getByPlaceholder(/search departments and practitioners/i)
    .fill(PRACTITIONER_NAME);
  await practitionerPicker.getByRole("option").first().click();

  // Reason for the visit.
  await sheet.getByPlaceholder("Type the reason for visit").fill(reason);

  // Pick the first bookable day; day cells show a remaining-token count.
  await sheet
    .locator("button:not([disabled])")
    .filter({ hasText: /^\d{1,2}\s*\d+ left$/ })
    .first()
    .click();

  // The slot picker auto-selects the first available slot, which reveals the
  // confirm action.
  const confirm = sheet.getByRole("button", { name: "Confirm Appointment" });
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await page.waitForURL(/\/appointments\/[a-f0-9-]+/);
  await expect(
    page.getByRole("heading", { name: "Appointment Details" }),
  ).toBeVisible();

  return page.url().match(/appointments\/([a-f0-9-]+)/)?.[1] ?? "";
}

/**
 * Appointment Detail Page Tests
 *
 * Tests the appointment detail view and its actions: viewing appointment and
 * patient information, checking in, generating a token, the quick actions and
 * actions menu, the reschedule dialog, and back navigation.
 */
test.describe("Appointment Detail Page", () => {
  const reason = faker.lorem.sentence();

  // The test DB is not reset between tests, and a patient cannot be booked into
  // the same slot twice, so we book a single appointment up front and view it
  // in each test. The one state-mutating test (check-in) runs last.
  let patientHome: string;
  let appointmentUrl: string;

  test.beforeAll(async ({ browser }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
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
    await expect(page.getByText("Phone", { exact: false })).toBeVisible();
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
