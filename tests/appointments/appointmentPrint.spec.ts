import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import {
  appointmentPrintUrl,
  createAppointmentViaApi,
  type CreatedAppointment,
} from "./helpers";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Appointment Print Page", () => {
  let facilityId: string;
  let patientId: string;
  let appointment: CreatedAppointment;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    appointment = await createAppointmentViaApi({
      facilityId,
      patientId,
      note: `Print E2E ${Date.now()}`,
    });

    await page.goto(appointmentPrintUrl(appointment));
  });

  test("should display print preview with appointment details", async ({
    page,
  }) => {
    await expect(page.locator("#section-to-print")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/appointment details/i).first()).toBeVisible();
  });

  test("should display patient and schedule information", async ({ page }) => {
    const printSection = page.locator("#section-to-print");

    await expect(printSection.getByText(/patient/i).first()).toBeVisible();
    await expect(printSection.getByText(appointment.note)).toBeVisible();

    // Date like "05 Sep, 2026" or similar appears in the print header
    await expect(
      printSection.locator("text=/\\d{1,2}\\s\\w{3},\\s\\d{4}/").first(),
    ).toBeVisible();
  });

  test("should show print controls", async ({ page }) => {
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();

    const printButton = page.getByRole("button", { name: /^print$/i });
    if ((await printButton.count()) > 0) {
      await expect(printButton.first()).toBeVisible();
    }
  });

  test("should render a QR code in the print layout", async ({ page }) => {
    await expect(page.locator("#section-to-print svg").first()).toBeVisible();
  });
});
