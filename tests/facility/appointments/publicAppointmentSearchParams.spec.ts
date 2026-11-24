import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";

import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

// The patient select and patient registration pages of a public booking read
// the slot and the reason from the URL with a typed search schema
// (`publicAppointmentPatientSearch` in `src/lib/router/search/appointments.ts`).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Public booking search params", () => {
  test("patient select keeps the slot and the reason for a new patient", async ({
    page,
    request,
  }) => {
    const facilityId = getFacilityId();
    const api = getApiUrl();

    await test.step("Sign in as a patient", async () => {
      // Development backends accept this OTP (see `send_otp` in care).
      const phoneNumber = `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`;
      const sent = await request.post(`${api}/api/v1/otp/send/`, {
        data: { phone_number: phoneNumber },
      });
      expect(sent.ok(), await sent.text()).toBe(true);
      const login = await request.post(`${api}/api/v1/otp/login/`, {
        data: { phone_number: phoneNumber, otp: "45612" },
      });
      expect(login.ok(), await login.text()).toBe(true);
      const { access } = (await login.json()) as { access: string };

      await page.addInitScript(
        ({ token, phone }) => {
          localStorage.setItem(
            "care_patient_token",
            JSON.stringify({
              token,
              phoneNumber: phone,
              createdAt: new Date().toISOString(),
            }),
          );
        },
        { token: access, phone: phoneNumber },
      );
    });

    const staff = await request.get(`${api}/api/v1/users/getcurrentuser/`, {
      headers: getApiHeaders(),
    });
    expect(staff.ok()).toBe(true);
    const staffId = ((await staff.json()) as { id: string }).id;
    const booking = `/facility/${facilityId}/appointments/${staffId}`;
    const search = new URLSearchParams({
      slotId: faker.string.uuid(),
      reason: faker.lorem.words(2),
    }).toString();

    await page.goto(`${booking}/patient-select?${search}`);

    // With a slot, the page stays (without one, it goes back to booking).
    await expect(page.getByText("Select/Register Patient")).toBeVisible();
    await expect(page).toHaveURL(`${booking}/patient-select?${search}`);

    await page.getByRole("button", { name: "Add New Patient" }).click();

    await expect(page).toHaveURL(`${booking}/patient-registration?${search}`);
  });
});
