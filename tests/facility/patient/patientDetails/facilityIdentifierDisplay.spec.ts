import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: getApiHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      `POST ${path} failed: ${response.status} — ${await response.text()}`,
    );
  }
  return (await response.json()) as T;
}

test.describe("Facility Patient Identifier - Display", () => {
  // Both tests share one identifier created in beforeAll; run them in a single
  // worker so parallel workers don't race on the same patient's identifiers.
  test.describe.configure({ mode: "serial" });

  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let displayName: string;
  let value: string;

  test.beforeAll(async () => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
    displayName = `Facility MRN ${faker.string.alphanumeric(6)}`;
    value = faker.string.alphanumeric(10).toUpperCase();

    // Create a facility-level identifier config and set a value for the patient.
    const config = await post<{ id: string }>(
      "/api/v1/patient_identifier_config/",
      {
        facility: facilityId,
        status: "active",
        config: {
          use: "official",
          description: "Facility level identifier",
          system: `https://example.org/${faker.string.uuid()}`,
          required: false,
          unique: false,
          regex: "",
          display: displayName,
          retrieve_config: {
            retrieve_with_dob: false,
            retrieve_with_year_of_birth: false,
            retrieve_with_otp: false,
          },
        },
      },
    );
    await post(`/api/v1/patient/${patientId}/update_identifier/`, {
      config: config.id,
      value,
    });
  });

  test("shows the facility identifier on the patient profile", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/patient/${patientId}/demography`);

    await expect(page.getByText(displayName).first()).toBeVisible();
    await expect(page.getByText(value).first()).toBeVisible();
  });

  test("shows the facility identifier in the encounter header", async ({
    page,
  }) => {
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );

    await expect(page.getByText(displayName).first()).toBeVisible();
    await expect(page.getByText(value).first()).toBeVisible();
  });
});
