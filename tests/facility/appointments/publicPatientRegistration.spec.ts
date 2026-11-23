import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { signInPatientViaApi } from "tests/helper/appointment";
import { getFieldErrorMessage } from "tests/helper/error";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Public patient registration form", () => {
  test(
    "should reject whitespace-only input in required text fields",
    { tag: ["@atomic", "@cap:appointment.public-patient.register"] },
    async ({ page, request }) => {
      const facilityId = getFacilityId();
      const api = getApiUrl();

      await test.step("Sign in as a patient", async () => {
        await signInPatientViaApi({ page, request });
      });

      const staff = await request.get(`${api}/api/v1/users/getcurrentuser/`, {
        headers: getApiHeaders(),
      });
      expect(staff.ok()).toBe(true);
      const staffId = ((await staff.json()) as { id: string }).id;
      const search = new URLSearchParams({
        slotId: faker.string.uuid(),
        reason: faker.lorem.words(2),
      }).toString();

      await page.goto(
        `/facility/${facilityId}/appointments/${staffId}/patient-registration?${search}`,
      );

      const whitespace = "   ";
      const fields = [
        page.getByRole("textbox", { name: "Patient Name *" }),
        page.getByRole("textbox", {
          name: "Current Address and Route to Home *",
        }),
      ];

      for (const field of fields) {
        await field.fill(whitespace);
      }

      await page.getByRole("button", { name: "Register Patient" }).click();

      for (const field of fields) {
        const errorMessage = getFieldErrorMessage(field);
        await expect(errorMessage).toBeVisible();
        await expect(errorMessage).toHaveText("This field is required");
      }
    },
  );
});
