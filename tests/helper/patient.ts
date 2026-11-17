import { faker } from "@faker-js/faker";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";

async function getGovtOrganizationId(): Promise<string> {
  const response = await fetch(
    `${getApiUrl()}/api/v1/organization/?org_type=govt&limit=1`,
    { headers: getApiHeaders() },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch organizations: ${response.status}`);
  }
  const { results } = (await response.json()) as {
    results: { id: string }[];
  };
  const id = results[0]?.id;
  if (!id) throw new Error("No govt organization found");
  return id;
}

/**
 * Create a patient through the API and return its id.
 *
 * Use this when a test needs a patient of its own, for example because a
 * patient can have only five active encounters in a facility.
 */
export async function createPatient(
  namePrefix: string,
  geoOrganizationId?: string,
): Promise<string> {
  const geoOrganization = geoOrganizationId ?? (await getGovtOrganizationId());

  // Patient creation takes a global lock, so parallel workers can collide.
  // The backend reports this as a 400, like a validation error, so match the
  // lock message to decide whether to retry.
  let error = "";
  for (let attempt = 1; attempt <= 5; attempt++) {
    const response = await fetch(`${getApiUrl()}/api/v1/patient/`, {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        name: `${namePrefix} ${faker.string.alphanumeric(6)}`,
        gender: "male",
        phone_number: `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`,
        date_of_birth: "1990-01-15",
        geo_organization: geoOrganization,
        identifiers: [],
      }),
    });
    if (response.ok) return ((await response.json()) as { id: string }).id;

    error = `${response.status} — ${await response.text()}`;
    if (!error.includes("try again after a while")) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw new Error(`Failed to create patient: ${error}`);
}
