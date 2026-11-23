import { expect, test } from "@playwright/test";
import { openServiceLocation } from "tests/facility/services/helpers";
import { getFieldErrorMessage } from "tests/helper/error";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Medication return create", () => {
  test("should reject whitespace-only input in required text fields", async ({
    page,
  }) => {
    const response = await page.request.get(
      `${getApiUrl()}/api/v1/patient/${getPatientId()}/`,
      { headers: getApiHeaders() },
    );
    await expect(response).toBeOK();
    const patient: {
      name: string;
      phone_number: string;
      year_of_birth: number;
    } = await response.json();

    const pharmacyPath = await openServiceLocation(
      page,
      getFacilityId(),
      "Main Pharmacy",
      "Pharmacy",
    );
    await page.goto(`${pharmacyPath}/medication_return`);
    await page
      .getByRole("button", { name: /Create Medication Return/ })
      .click();
    const sheet = page.getByRole("dialog", {
      name: "Create Medication Return",
    });

    await test.step("Select the patient", async () => {
      await sheet
        .getByRole("textbox", { name: "Patient Phone Number" })
        .fill(patient.phone_number.replace(/^\+91/, ""));
      await sheet.getByRole("option", { name: patient.name }).click();

      const verify = page.getByRole("dialog", {
        name: "Verify Patient Identity",
      });
      await verify
        .getByRole("textbox", { name: "Year of Birth (YYYY)" })
        .fill(String(patient.year_of_birth));
      await verify.getByRole("button", { name: "Verify" }).click();
    });

    const nameField = sheet.getByRole("textbox", { name: "Name", exact: true });
    await expect(nameField).toHaveValue(/Medication Return/);
    await nameField.fill("   ");

    await sheet.getByRole("button", { name: "Create Return" }).click();

    const errorMessage = getFieldErrorMessage(nameField);
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText("Name is required");
  });
});
