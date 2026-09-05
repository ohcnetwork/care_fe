import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import {
  appointmentDetailUrl,
  createAppointmentViaApi,
  type CreatedAppointment,
} from "./helpers";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Appointment Detail Page", () => {
  let facilityId: string;
  let patientId: string;
  let appointment: CreatedAppointment;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    appointment = await createAppointmentViaApi({
      facilityId,
      patientId,
      note: `Detail E2E ${Date.now()}`,
    });

    await page.goto(appointmentDetailUrl(appointment));
  });

  test("should display appointment details and patient information", async ({
    page,
  }) => {
    await expect(page.getByText(/appointment details/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /schedule information/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /patient information/i }),
    ).toBeVisible();
    await expect(page.getByText(appointment.note)).toBeVisible();
    await expect(page.getByText(/booked/i).first()).toBeVisible();
  });

  test("should expose check-in and actions for a booked appointment", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: /check-in/i })).toBeVisible();

    // Kebab menu is the outline icon button beside Check-In
    await page
      .getByRole("button", { name: /check-in/i })
      .locator("..")
      .getByRole("button")
      .nth(1)
      .click();

    await expect(
      page.getByRole("menuitem", { name: /mark as fulfilled/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /cancel appointment/i }),
    ).toBeVisible();
  });

  test("should check in a booked appointment", async ({ page }) => {
    const checkIn = page.getByRole("button", { name: /check-in/i });
    await expect(checkIn).toBeEnabled({ timeout: 10000 });

    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/appointments/${appointment.id}/`) &&
        response.request().method() === "PUT",
    );

    await checkIn.click();
    const response = await updateResponse;
    expect(response.status()).toBe(200);

    await expect(
      page
        .getByText(/^checked-in$/i)
        .or(page.getByText(/checked.?in/i))
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to print view from detail page", async ({ page }) => {
    await page.getByRole("link", { name: /print appointment/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/appointments/${appointment.id}/print`),
    );
  });

  test("should cancel an appointment from actions menu", async ({ page }) => {
    await page
      .getByRole("button", { name: /check-in/i })
      .locator("..")
      .getByRole("button")
      .nth(1)
      .click();

    await page.getByRole("menuitem", { name: /cancel appointment/i }).click();
    await expect(
      page.getByRole("heading", { name: /cancel appointment/i }),
    ).toBeVisible();

    // Note is pre-filled from appointment creation; ensure Confirm is enabled
    const noteField = page.locator('[role="alertdialog"] textarea').first();
    if (!(await noteField.inputValue()).trim()) {
      await noteField.fill("Cancelled by Playwright E2E");
    }

    const confirmResponse = page.waitForResponse(
      (response) =>
        (response.url().includes("/api/v1/batch_requests/") ||
          response.url().includes(`/appointments/${appointment.id}/`)) &&
        ["PUT", "POST"].includes(response.request().method()),
    );

    await page
      .locator('[role="alertdialog"]')
      .getByRole("button", { name: /^confirm$/i })
      .click();
    const response = await confirmResponse;
    expect([200, 201]).toContain(response.status());
    await expect(page.getByText(/appointment cancelled/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
