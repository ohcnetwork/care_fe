import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * P1-1 / P1-2: the fill page fetches the questionnaire (and, for an
 * encounter subject, the encounter) by id but never checked the ids
 * against what the mount can actually supply. A location/device/facility
 * questionnaire id pasted into a patient-bound route used to mount and
 * render the whole form before the backend rejected it at Save with a
 * confusing 400; a URL pairing one patient with ANOTHER patient's
 * encounter used to render that patient's identity banner, clinical
 * history and structured-widget context next to the wrong record. Both
 * now render the shared `FillErrorPage` instead of the canvas.
 */

/** Backend E2E fixture: subject_type "location" — never fillable on a
 *  patient-bound (patient/encounter) route. */
const LOCATION_QUESTIONNAIRE_SLUG = "e2e-subject-location";
/** subject_type "encounter" fixture already relied on by the other fill
 *  specs (`fillPage.spec.ts`) — used here only to get past the P1-1 guard
 *  so the P1-2 (patient/encounter) guard can be exercised in isolation. */
const ENCOUNTER_QUESTIONNAIRE_SLUG = "respiratory_status-v3";

const SUBJECT_TYPE_MISMATCH_MESSAGE =
  "This questionnaire is for a different subject type and can't be filled here.";
const PATIENT_ENCOUNTER_MISMATCH_MESSAGE =
  "This encounter belongs to a different patient. Check the link and try again.";

/** Tracks POSTs to the batch endpoint from the moment it's called —
 *  registering the listener AFTER an interaction would only prove no
 *  request had arrived YET, not that the action never sends one (same
 *  pattern as fillHardBlock.spec.ts / fillSubmitGuards.spec.ts). */
function trackBatchRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      request.url().includes("/api/v1/batch_requests/")
    ) {
      urls.push(request.url());
    }
  });
  return urls;
}

/** Creates a fresh patient through the same API shape the backend E2E
 *  fixtures use, so the spec doesn't have to depend on a second patient
 *  existing in the fixture set. */
async function createPatient(): Promise<{ id: string; name: string }> {
  const phone = `+91${faker.helpers.fromRegExp(/[6-9][0-9]{9}/)}`;
  const orgRes = await fetch(
    `${apiBaseUrl()}/api/v1/organization/?org_type=govt&limit=1`,
    { headers: adminApiHeaders() },
  );
  if (!orgRes.ok) {
    throw new Error(`Failed to fetch organizations: ${orgRes.status}`);
  }
  const orgData = (await orgRes.json()) as { results: { id: string }[] };
  const geoOrg = orgData.results[0]?.id;
  if (!geoOrg) {
    throw new Error("No govt organization found for geo_organization");
  }

  const name = `Mount Guard Other Patient ${faker.string.alphanumeric(6)}`;
  const res = await fetch(`${apiBaseUrl()}/api/v1/patient/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      name,
      gender: "male",
      phone_number: phone,
      date_of_birth: "1990-01-15",
      geo_organization: geoOrg,
      identifiers: [],
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to create patient: ${res.status} — ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { id: string };
  return { id: data.id, name };
}

/** Creates an encounter for the given patient — the "different patient's
 *  encounter" half of the P1-2 fixture pairing. */
async function createEncounter(
  facilityId: string,
  patientId: string,
): Promise<string> {
  const orgRes = await fetch(
    `${apiBaseUrl()}/api/v1/facility/${facilityId}/organizations/?limit=1`,
    { headers: adminApiHeaders() },
  );
  if (!orgRes.ok) {
    throw new Error(`Failed to fetch facility organizations: ${orgRes.status}`);
  }
  const orgData = (await orgRes.json()) as { results: { id: string }[] };
  const organizationId = orgData.results[0]?.id;
  if (!organizationId) {
    throw new Error(`No organization found for facility ${facilityId}`);
  }

  const res = await fetch(`${apiBaseUrl()}/api/v1/encounter/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      patient: patientId,
      facility: facilityId,
      status: "in_progress",
      encounter_class: "amb",
      period: { start: new Date().toISOString() },
      priority: "routine",
      organizations: [organizationId],
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to create encounter: ${res.status} — ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

test.describe("Fill mount guards", () => {
  test("P1-1: a location-subject questionnaire mounted on the encounter fill route renders the mismatch guard, not the form", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const encounterId = getEncounterId();
    const questionnaireId = await getQuestionnaireIdBySlug(
      LOCATION_QUESTIONNAIRE_SLUG,
    );

    const posts = trackBatchRequests(page);

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${questionnaireId}`,
    );

    await expect(
      page.getByRole("alert").getByText(SUBJECT_TYPE_MISMATCH_MESSAGE),
    ).toBeVisible();

    // No form canvas at all — no canvas region, no question blocks, no
    // Save/Cancel actions the clinician could act on.
    await expect(page.getByRole("region", { name: "Form canvas" })).toHaveCount(
      0,
    );
    await expect(page.locator("[data-question-id]")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Save Changes" }),
    ).toHaveCount(0);

    // Whatever IS on screen (the guard's only control is "Back") must
    // never reach the submit path if clicked.
    const buttons = page.getByRole("button");
    const buttonCount = await buttons.count();
    if (buttonCount > 0) {
      await buttons.first().click();
    }
    await page.waitForLoadState("networkidle");
    expect(
      posts,
      "a subject-family mismatch must never reach batch_requests, even after an interaction",
    ).toHaveLength(0);
  });

  test("P1-2: a URL pairing one patient with a different patient's encounter renders the mismatch guard, not the patient's data", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const patientId = getPatientId();
    const otherPatient = await createPatient();
    const otherPatientEncounterId = await createEncounter(
      facilityId,
      otherPatient.id,
    );
    const questionnaireId = await getQuestionnaireIdBySlug(
      ENCOUNTER_QUESTIONNAIRE_SLUG,
    );

    // The route's patientId is the fixture patient; the encounterId
    // belongs to `otherPatient` instead.
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${otherPatientEncounterId}/questionnaire/${questionnaireId}`,
    );

    await expect(
      page.getByRole("alert").getByText(PATIENT_ENCOUNTER_MISMATCH_MESSAGE),
    ).toBeVisible();

    // No patient banner, no clinical history tab, and — the safety-relevant
    // check — the OTHER patient's name never reaches the DOM beside the
    // route's patientId.
    await expect(
      page.getByRole("tab", { name: "Patient Clinical History" }),
    ).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Form canvas" })).toHaveCount(
      0,
    );
    await expect(page.getByText(otherPatient.name)).toHaveCount(0);
  });
});
