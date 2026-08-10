import { type Page, expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

// The admin user is a super admin, and super admins bypass every permission
// check. The nurse account gets real object-level permission checks.
test.use({ storageState: "tests/.auth/nurse.json" });

const CREATE_ENCOUNTER_PERMISSION = "can_create_encounter";

/**
 * Force the encounter history empty state.
 * The API returns an empty encounter list for the patient.
 */
async function stubEmptyEncounterList(page: Page, patientId: string) {
  await page.route(
    (url) =>
      url.pathname === "/api/v1/encounter/" &&
      url.searchParams.get("patient") === patientId,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      }),
  );
}

/**
 * Control the "can_create_encounter" permission on the patient response.
 * The test keeps or removes the permission before the page renders.
 */
async function stubPatientPermission(
  page: Page,
  patientId: string,
  grantCreateEncounter: boolean,
) {
  await page.route(
    (url) => url.pathname === `/api/v1/patient/${patientId}/`,
    async (route) => {
      const response = await route.fetch();
      const patient = await response.json();
      const permissions: string[] = patient.permissions ?? [];

      patient.permissions = grantCreateEncounter
        ? Array.from(new Set([...permissions, CREATE_ENCOUNTER_PERMISSION]))
        : permissions.filter(
            (permission) => permission !== CREATE_ENCOUNTER_PERMISSION,
          );

      await route.fulfill({ response, json: patient });
    },
  );
}

test.describe("Encounter history create button permission", () => {
  let facilityId: string;
  let patientId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
    patientId = getPatientId();
  });

  test("shows the create encounter button with the create permission", async ({
    page,
  }) => {
    await stubEmptyEncounterList(page, patientId);
    await stubPatientPermission(page, patientId, true);

    await page.goto(`/facility/${facilityId}/patient/${patientId}/encounters`);

    await expect(page.getByText("No active encounters found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Encounter" }),
    ).toBeVisible();
  });

  test("hides the create encounter button without the create permission", async ({
    page,
  }) => {
    await stubEmptyEncounterList(page, patientId);
    await stubPatientPermission(page, patientId, false);

    await page.goto(`/facility/${facilityId}/patient/${patientId}/encounters`);

    await expect(page.getByText("No active encounters found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Encounter" }),
    ).toHaveCount(0);
  });
});
