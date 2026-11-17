import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { getFacilityId } from "tests/support/facilityId";

const signedOut = { cookies: [], origins: [] };

test.describe("Route areas", () => {
  let facilityId: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
  });

  test.describe("signed out", () => {
    test.use({ storageState: signedOut });

    test("a staff URL goes to the sign-in and back after sign-in", async ({
      page,
    }) => {
      const target = `/facility/${facilityId}/settings/devices`;
      await page.goto(target);

      await expect(page).toHaveURL(/\/login\?redirect=/);
      const redirect = new URL(page.url()).searchParams.get("redirect");
      expect(new URL(redirect!).pathname).toBe(target);

      await page.getByRole("textbox", { name: /username/i }).fill("admin");
      await page.getByLabel(/^password$/i).fill("admin");
      await page.getByRole("button", { name: /^sign in$/i }).click();

      await expect(page).toHaveURL(new RegExp(`${target}$`));
      await expect(
        page.getByRole("link", { name: "Add Device" }),
      ).toBeVisible();
    });
  });

  test.describe("signed in as staff", () => {
    test.use({ storageState: "tests/.auth/user.json" });

    test("a public page goes to the dashboard and keeps the query", async ({
      page,
    }) => {
      await page.goto("/login?source=test");

      await expect(page).toHaveURL(/\/\?source=test$/);
      await expect(
        page.getByRole("heading", {
          name: /^Good (Morning|Afternoon|Evening)/,
        }),
      ).toBeVisible();
    });

    test("a patient portal page shows not found in the staff shell", async ({
      page,
    }) => {
      await page.goto("/nearby_facilities");

      await expect(
        page.getByRole("heading", { name: "Page Not Found" }),
      ).toBeVisible();
      await expect(page.locator('[data-slot="sidebar"]').first()).toBeVisible();
    });

    test("/user goes to /users", async ({ page }) => {
      await page.goto("/user");

      await expect(page).toHaveURL(/\/users$/);
    });
  });

  test.describe("signed in as a patient", () => {
    test.use({ storageState: signedOut });

    test("patient select without a slot goes back to booking", async ({
      page,
      request,
    }) => {
      const api = apiBaseUrl();
      const staff = await request.get(`${api}/api/v1/users/getcurrentuser/`, {
        headers: adminApiHeaders(),
      });
      expect(staff.ok()).toBe(true);
      const staffId = ((await staff.json()) as { id: string }).id;

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

      const booking = `/facility/${facilityId}/appointments/${staffId}`;
      await page.goto(`${booking}/patient-select`);

      await expect(page).toHaveURL(new RegExp(`${booking}/book-appointment$`));
      await expect(page.getByText("Selected Slot Not Found")).toBeVisible();
    });
  });
});
