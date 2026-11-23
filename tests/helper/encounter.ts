import { setTimeout as delay } from "node:timers/promises";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";

interface TestEncounterOptions {
  status?: string;
  encounterClass?: string;
  period?: { start: string; end?: string };
  organizations?: string[];
}

/**
 * Creates an encounter through the API and returns its id. Defaults to an
 * in-progress ambulatory encounter starting now.
 */
export async function createTestEncounter(
  facilityId: string,
  patientId: string,
  {
    status = "in_progress",
    encounterClass = "amb",
    period = { start: new Date().toISOString() },
    organizations = [],
  }: TestEncounterOptions = {},
): Promise<string> {
  const headers = adminApiHeaders();
  const body = JSON.stringify({
    patient: patientId,
    facility: facilityId,
    status,
    encounter_class: encounterClass,
    period,
    priority: "routine",
    organizations,
  });
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${apiBaseUrl()}/api/v1/encounter/`, {
      method: "POST",
      headers,
      body,
    });
    if (response.ok) {
      return ((await response.json()) as { id: string }).id;
    }
    const error = await response.text();
    // The backend serializes encounter creation per facility with a lock
    // (the rejected create is rolled back), so retry only that rejection.
    if (
      attempt >= 4 ||
      response.status !== 400 ||
      !error.includes("Encounter creation failed, try again after a while")
    ) {
      throw new Error(
        `Failed to create test encounter: ${response.status} — ${error}`,
      );
    }
    await delay(250 * (attempt + 1));
  }
}
