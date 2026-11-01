import { faker } from "@faker-js/faker";
import { setTimeout as delay } from "node:timers/promises";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";

/**
 * Creates a throwaway patient through the API. Specs that create encounters
 * use one each: the backend caps a patient's active encounters per facility,
 * so creating them for a shared patient eventually rejects every new one.
 */
export async function createTestPatient(
  namePrefix = "E2E Patient",
): Promise<string> {
  const headers = adminApiHeaders();
  const organizationsResponse = await fetch(
    `${apiBaseUrl()}/api/v1/organization/?org_type=govt&limit=1`,
    { headers },
  );
  if (!organizationsResponse.ok) {
    throw new Error(
      `Failed to fetch test patient organizations: ${organizationsResponse.status}`,
    );
  }
  const organizations = (await organizationsResponse.json()) as {
    results: { id: string }[];
  };
  const geoOrganization = organizations.results[0]?.id;
  if (!geoOrganization) {
    throw new Error("No government organization for the test patient");
  }
  const body = JSON.stringify({
    name: `${namePrefix} ${faker.string.alphanumeric(12)}`,
    gender: "male",
    phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
    date_of_birth: "1990-01-15",
    geo_organization: geoOrganization,
    identifiers: [],
  });
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${apiBaseUrl()}/api/v1/patient/`, {
      method: "POST",
      headers,
      body,
    });
    if (response.ok) {
      return ((await response.json()) as { id: string }).id;
    }
    const error = await response.text();
    // The backend serializes patient creation with a global lock. Only
    // retry its explicit pre-create rejection, never an ambiguous failure.
    if (
      attempt >= 4 ||
      response.status !== 400 ||
      !error.includes("Patient creation failed, try again after a while")
    ) {
      throw new Error(
        `Failed to create test patient: ${response.status} — ${error}`,
      );
    }
    await delay(250 * (attempt + 1));
  }
}
