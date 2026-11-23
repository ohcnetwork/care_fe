import { faker } from "@faker-js/faker";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

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

/**
 * Creates a facility-level identifier config and sets a value for the
 * patient. Returns the identifier's display name and value.
 */
async function seedFacilityIdentifier(
  facilityId: string,
  patientId: string,
): Promise<{ displayName: string; value: string }> {
  const displayName = `Facility MRN ${faker.string.alphanumeric(6)}`;
  const value = faker.string.alphanumeric(10).toUpperCase();

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
  return { displayName, value };
}

test.describe("Facility Patient Identifier - Display", () => {
  // Each test sets the identifier on a throwaway patient + encounter of its
  // own, so the shared fixture patient keeps its identifiers.

  test(
    "shows the facility identifier on the patient profile",
    { tag: ["@atomic", "@cap:patient.identifier.view"] },
    async ({ page, facilityId, isolatedEncounter }) => {
      const { patientId } = isolatedEncounter;
      const { displayName, value } = await seedFacilityIdentifier(
        facilityId,
        patientId,
      );

      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/demography`,
      );

      await expect(page.getByText(displayName).first()).toBeVisible();
      await expect(page.getByText(value).first()).toBeVisible();
    },
  );

  test(
    "shows the facility identifier in the encounter header",
    { tag: ["@atomic", "@cap:patient.identifier.view"] },
    async ({ page, facilityId, isolatedEncounter }) => {
      const { patientId, encounterId } = isolatedEncounter;
      const { displayName, value } = await seedFacilityIdentifier(
        facilityId,
        patientId,
      );

      await page.goto(
        `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
      );

      await expect(page.getByText(displayName).first()).toBeVisible();
      await expect(page.getByText(value).first()).toBeVisible();
    },
  );
});
