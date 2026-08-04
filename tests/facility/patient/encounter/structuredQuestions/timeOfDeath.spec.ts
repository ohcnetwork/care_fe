import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import { format, subHours } from "date-fns";
import { submitForm } from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  getQuestionnaireIdBySlug,
  questionBlock,
} from "tests/helper/questionnaireV2";
import {
  STRUCTURED_FIXTURES,
  structuredFixtureUrl,
} from "tests/helper/structuredFixtures";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Per-type matrix (spec §10) for `time_of_death` — Task 10 Step 1. The
 * draft lifecycle is the point: this type went from a blanket
 * `draftPolicy: "exclude"` under v1 (D2's predecessor) to `"serialize"`
 * under contract v2 (`definitions/timeOfDeath.tsx`), so "fill, reload,
 * restore" is a genuinely NEW capability this port adds, not a regression
 * guard.
 *
 * SAFETY NOTE (read before touching this file): `time_of_death`'s
 * `toRequests` (`structured/types/timeOfDeath/model.ts`) PUTs
 * `deceased_datetime` onto `/api/v1/patient/{patientId}/` and — unlike
 * every sibling type in this wave — has NO delete/clear verb: once a
 * patient is marked deceased there is no UI path to undo it. The shared
 * fixture patient (`getPatientId()`) is reused by essentially every other
 * spec in this suite, so the ONE test here that actually calls Save
 * (`"submit"`, below) creates its OWN throwaway patient + encounter via the
 * API first — mirroring `fillMountGuards.spec.ts`'s `createPatient`/
 * `createEncounter` helpers — rather than ever touching the shared one.
 * Every other test in this file only interacts with the client-side
 * store/draft and never clicks Save, so it is safe to run against the
 * shared fixture encounter.
 */

/** Mirrors `fillAutosave.spec.ts`'s own private helper — not exported
 *  there, so reproduced here rather than reaching into that file. */
async function fillDraftCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith("care_qn_fill_draft--"),
      ).length,
  );
}

/** A datetime-local value, always safely in the past relative to `max`
 *  (`format(new Date(), "yyyy-MM-dd'T'HH:mm")` on the control) regardless
 *  of when this suite runs. */
function pastDateTimeLocal(hoursAgo: number): string {
  return format(subHours(new Date(), hoursAgo), "yyyy-MM-dd'T'HH:mm");
}

/** Creates a throwaway patient through the same API shape the backend E2E
 *  fixtures use (mirrors `fillMountGuards.spec.ts`'s `createPatient`) — so
 *  the one test that actually submits a deceased datetime never touches
 *  the shared fixture patient every other spec in this suite depends on. */
async function createIsolatedPatient(): Promise<{
  id: string;
  name: string;
}> {
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

  const name = `Time Of Death E2E ${faker.string.alphanumeric(6)}`;
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

/** Creates an encounter for the given patient (mirrors
 *  `fillMountGuards.spec.ts`'s `createEncounter`). */
async function createIsolatedEncounter(
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

const fixture = STRUCTURED_FIXTURES.time_of_death;

test.describe("Structured question: time_of_death", () => {
  test("add, edit and remove round-trip through the datetime control, and removal leaves no draft", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    await page.goto(structuredFixtureUrl(questionnaireId));

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();
    const input = block.getByLabel(fixture.label, { exact: true });

    // add
    const first = pastDateTimeLocal(2);
    await input.fill(first);
    await expect(input).toHaveValue(first);
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // edit — the new value round-trips through the SAME control, not a
    // second one.
    const second = pastDateTimeLocal(1);
    await input.fill(second);
    await expect(input).toHaveValue(second);

    // remove — clearing the field annihilates the add (`isEmptyRow`), so
    // the section reads unanswered (the control itself is blank) and,
    // after the autosave debounce, the local draft carries no content for
    // this form at all.
    await input.fill("");
    await expect(input).toHaveValue("");
    await expect.poll(() => fillDraftCount(page), { timeout: 5000 }).toBe(0);
  });

  test("draft: fill, reload, restore from the bar, and the datetime comes back", async ({
    page,
  }) => {
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);
    const fillUrl = structuredFixtureUrl(questionnaireId);
    await page.goto(fillUrl);

    const block = questionBlock(page, fixture.label);
    const input = block.getByLabel(fixture.label, { exact: true });
    const value = pastDateTimeLocal(3);
    await input.fill(value);
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");

    // Reload — the pagehide flush persists the pending debounce; the fresh
    // mount must prompt rather than silently reseed (D2's pin: under v1 the
    // blanket "exclude" made this whole path impossible for this type).
    await page.reload();
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await expect(
      questionBlock(page, fixture.label).getByLabel(fixture.label, {
        exact: true,
      }),
    ).toHaveValue("");

    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.getByText(/unsaved entry from/i)).not.toBeVisible();
    await expect(
      questionBlock(page, fixture.label).getByLabel(fixture.label, {
        exact: true,
      }),
    ).toHaveValue(value);
    await expect(
      page.getByRole("tab", { name: /Questionnaire/ }),
    ).toContainText("Draft");
  });

  test("submit: saves the deceased datetime and it shows on the patient's page", async ({
    page,
  }) => {
    test.slow();
    const facilityId = getFacilityId();
    const patient = await createIsolatedPatient();
    const encounterId = await createIsolatedEncounter(facilityId, patient.id);
    const questionnaireId = await getQuestionnaireIdBySlug(fixture.slug);

    await page.goto(
      `/facility/${facilityId}/patient/${patient.id}/encounter/${encounterId}/questionnaire/${questionnaireId}`,
    );

    const block = questionBlock(page, fixture.label);
    await expect(block).toBeVisible();
    const value = pastDateTimeLocal(5);
    await block.getByLabel(fixture.label, { exact: true }).fill(value);

    await submitForm(page);
    await expectToast(page, /questionnaire submitted successfully/i);
    await page.waitForURL(/\/encounter\/[^/]+\/updates$/);

    // `PatientDeceasedInfo` (`components/Patient/PatientHeader.tsx`) renders
    // on the encounter page once `patient.deceased_datetime` is set — this
    // is the one place the widget's PUT is independently observable.
    await expect(page.getByText(/passed away on/i)).toBeVisible();
  });
});
