import { expect, test, type Page } from "@playwright/test";

import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

// The appointment page reads its query string with a typed search schema
// (`appointmentShowSearch` in `src/lib/router/search/appointments.ts`).
// `showSuccess=true`, set after a booking, shows the success message.

const successAlert = (page: Page) =>
  page
    .getByRole("alert")
    .filter({ hasText: "Appointment created successfully" });

test.describe("Appointment page search params", () => {
  let appointmentPath: string;

  test.beforeEach(async ({ request }) => {
    const facilityId = getFacilityId();
    const appointments = await request.get(
      `${getApiUrl()}/api/v1/facility/${facilityId}/appointments/?limit=1&resource_type=practitioner`,
      { headers: getApiHeaders() },
    );
    expect(appointments.ok()).toBe(true);
    const [appointment] = (
      (await appointments.json()) as {
        results: { id: string; patient: { id: string } }[];
      }
    ).results;
    expect(appointment, "The facility needs an appointment").toBeDefined();
    appointmentPath = `/facility/${facilityId}/patient/${appointment.patient.id}/appointments/${appointment.id}`;
  });

  test("shows the success message from the URL and drops it on close", async ({
    page,
  }) => {
    await page.goto(`${appointmentPath}?showSuccess=true`);

    await expect(successAlert(page)).toBeVisible();

    await successAlert(page).getByRole("button", { name: "Close" }).click();

    await expect(successAlert(page)).toBeHidden();
    await expect(page).toHaveURL(appointmentPath);
  });

  test("ignores an invalid showSuccess value", async ({ page }) => {
    await page.goto(`${appointmentPath}?showSuccess=bogus`);

    await expect(
      page.getByRole("heading", { name: "Appointment Details" }),
    ).toBeVisible();
    await expect(successAlert(page)).toBeHidden();
  });
});
