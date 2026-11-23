import { expect, test, type Page } from "@playwright/test";

import { createAppointmentViaApi } from "tests/helper/appointment";
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
    // A fresh booking of our own, not whichever appointment the facility has.
    const appointment = await createAppointmentViaApi({
      request,
      facilityId: getFacilityId(),
    });
    appointmentPath = appointment.path;
  });

  test(
    "shows the success message from the URL and drops it on close",
    { tag: ["@atomic", "@cap:appointment.detail.view"] },
    async ({ page }) => {
      await page.goto(`${appointmentPath}?showSuccess=true`);

      await expect(successAlert(page)).toBeVisible();

      await successAlert(page).getByRole("button", { name: "Close" }).click();

      await expect(successAlert(page)).toBeHidden();
      await expect(page).toHaveURL(appointmentPath);
    },
  );

  test(
    "ignores an invalid showSuccess value",
    { tag: ["@atomic", "@cap:appointment.detail.view"] },
    async ({ page }) => {
      await page.goto(`${appointmentPath}?showSuccess=bogus`);

      await expect(
        page.getByRole("heading", { name: "Appointment Details" }),
      ).toBeVisible();
      await expect(successAlert(page)).toBeHidden();
    },
  );
});
