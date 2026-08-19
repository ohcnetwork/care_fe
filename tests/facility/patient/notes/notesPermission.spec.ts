import { expect, type Page, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

/**
 * Patient notes: view = can_view_clinical_data, write = can_write_patient.
 * Encounter notes: view = clinical-data read, write = can_write_encounter_clinical_data.
 *
 * Write without view hides the Notes tab. View without write keeps the tab
 * (and existing threads) but must not show create or send controls.
 *
 * Object permissions are stubbed on the patient/encounter GET payloads so the
 * cases do not depend on a dedicated role. Nurse is used because admin is a
 * superuser and bypasses object-level checks.
 */

test.use({
  storageState: "tests/.auth/nurse.json",
  viewport: { width: 1536, height: 900 },
});

const PATIENT_DETAIL = /\/api\/v1\/patient\/[0-9a-fA-F-]{36}\/?(\?|$)/;
const ENCOUNTER_DETAIL = /\/api\/v1\/encounter\/[0-9a-fA-F-]{36}\/?(\?|$)/;

function withoutPermission(permissions: string[], slug: string) {
  return permissions.filter((permission) => permission !== slug);
}

async function stubObjectPermissions(
  page: Page,
  options: {
    patient?: (permissions: string[]) => string[];
    encounter?: (permissions: string[]) => string[];
  },
) {
  if (options.patient) {
    await page.route(PATIENT_DETAIL, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      const json = await response.json();
      if (Array.isArray(json.permissions)) {
        json.permissions = options.patient!(json.permissions);
      }
      await route.fulfill({ response, json });
    });
  }

  if (options.encounter) {
    await page.route(ENCOUNTER_DETAIL, async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      const json = await response.json();
      if (Array.isArray(json.permissions)) {
        json.permissions = options.encounter!(json.permissions);
      }
      await route.fulfill({ response, json });
    });
  }
}

function notesUrls() {
  const facilityId = getFacilityId();
  const patientId = getPatientId();
  const encounterId = getEncounterId();
  return {
    encounter: `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/notes`,
    patient: `/facility/${facilityId}/patient/${patientId}/notes`,
  };
}

async function expectCreateNotesHidden(page: Page) {
  await expect(
    page.getByRole("button", { name: "New", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start New Discussion" }),
  ).toHaveCount(0);
  await expect(page.getByPlaceholder("Type your message...")).toHaveCount(0);
}

async function expectCreateNotesAvailable(page: Page) {
  const newButton = page.getByRole("button", { name: "New", exact: true });
  const startButton = page.getByRole("button", {
    name: "Start New Discussion",
  });
  await expect(newButton.or(startButton).first()).toBeVisible();
}

async function waitForNotesSurface(page: Page) {
  await expect(
    page
      .getByRole("heading", { name: "Discussions" })
      .or(page.getByRole("heading", { name: "Welcome to Discussions" })),
  ).toBeVisible();
}

test.describe("Notes create-button permissions", () => {
  test("nurse with write access can create notes on encounter and patient pages", async ({
    page,
  }) => {
    const urls = notesUrls();

    await page.goto(urls.encounter);
    await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await waitForNotesSurface(page);
    await expectCreateNotesAvailable(page);

    await page.goto(urls.patient);
    await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitForNotesSurface(page);
    await expectCreateNotesAvailable(page);
  });

  test("hides create actions when the user can view but not write", async ({
    page,
  }) => {
    await stubObjectPermissions(page, {
      patient: (permissions) =>
        withoutPermission(permissions, "can_write_patient"),
      encounter: (permissions) =>
        withoutPermission(permissions, "can_write_encounter_clinical_data"),
    });

    const urls = notesUrls();

    await page.goto(urls.encounter);
    await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await waitForNotesSurface(page);
    await expectCreateNotesHidden(page);

    await page.goto(urls.patient);
    await expect(page.getByRole("tab", { name: "Notes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitForNotesSurface(page);
    await expectCreateNotesHidden(page);
  });

  test("hides the Notes tab when the user can write but not view", async ({
    page,
  }) => {
    await stubObjectPermissions(page, {
      patient: (permissions) =>
        withoutPermission(permissions, "can_view_clinical_data"),
      encounter: (permissions) =>
        withoutPermission(permissions, "can_read_encounter_clinical_data"),
    });

    const urls = notesUrls();

    await page.goto(urls.encounter);
    await expect(page.getByRole("tab", { name: "Notes" })).toHaveCount(0);
    await expectCreateNotesHidden(page);

    await page.goto(urls.patient);
    await expect(page.getByRole("tab", { name: "Notes" })).toHaveCount(0);
    await expectCreateNotesHidden(page);
  });
});
