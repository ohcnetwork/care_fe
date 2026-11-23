import { faker } from "@faker-js/faker";
import {
  ENCOUNTER_CLASS_CODES,
  ENCOUNTER_CLASSES,
} from "tests/facility/patient/encounter/encounterClasses";
import {
  createEncounterViaUi,
  submitEncounterCreateDialog,
} from "tests/helper/encounter";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { expect, test } from "tests/support/test";

import type { EncounterRead } from "../../../../src/types/emr/encounter/encounter";

test.use({ storageState: "tests/.auth/user.json" });

/** Status options of the Create Encounter dialog and their API codes. */
const ENCOUNTER_STATUS_CODES: Record<string, string> = {
  "In Progress": "in_progress",
  Planned: "planned",
  "On Hold": "on_hold",
};
const encounterStatuses = Object.keys(ENCOUNTER_STATUS_CODES);

/** Priority options of the Create Encounter dialog and their API codes. */
const ENCOUNTER_PRIORITY_CODES: Record<string, string> = {
  Stat: "stat",
  ASAP: "ASAP",
  Emergency: "emergency",
  Urgent: "urgent",
  Routine: "routine",
  Elective: "elective",
  "Rush reporting": "rush_reporting",
  "Timing critical": "timing_critical",
  "Callback results": "callback_results",
  "Callback for scheduling": "callback_for_scheduling",
  "Pre-op": "preop",
  "As needed": "as_needed",
  "Use as directed": "use_as_directed",
};
const encounterPriorities = Object.keys(ENCOUNTER_PRIORITY_CODES);

test.describe("Create an Encounter", () => {
  let randomEncounterClass: (typeof ENCOUNTER_CLASSES)[number];
  let randomEncounterStatus: string;
  let randomEncounterPriority: string;

  test.beforeEach(() => {
    // Select random values for this test run
    randomEncounterClass = faker.helpers.arrayElement(ENCOUNTER_CLASSES);
    randomEncounterStatus = faker.helpers.arrayElement(encounterStatuses);
    randomEncounterPriority = faker.helpers.arrayElement(encounterPriorities);
  });

  test(
    "through patient home",
    { tag: ["@atomic", "@cap:encounter.create"] },
    async ({ page, facilityId, isolatedPatient }) => {
      // A patient of its own: the backend caps active encounters per patient,
      // so the first listed patient may not accept another one.
      await createEncounterViaUi(page, {
        facilityId,
        patientId: isolatedPatient.patientId,
        encounterClass: randomEncounterClass,
      });

      // Verify on encounter page
      await expect(
        page
          .getByRole("region", { name: "Encounter", exact: true })
          .getByText(randomEncounterClass, { exact: true }),
      ).toBeVisible();
    },
  );

  test(
    "through phone number + year",
    { tag: ["@atomic", "@cap:encounter.create"] },
    async ({ page, request, facilityId, isolatedPatient }) => {
      // A patient of its own (see above); read its phone number and year of
      // birth instead of taking them from the first listed patient.
      const patientResponse = await request.get(
        `${getApiUrl()}/api/v1/patient/${isolatedPatient.patientId}/`,
        { headers: getApiHeaders() },
      );
      await expect(patientResponse).toBeOK();
      const patient = (await patientResponse.json()) as {
        phone_number: string;
        date_of_birth?: string;
        year_of_birth?: number;
      };

      // Store the phone number for future use (remove any whitespace and special characters)
      // To do: make it country code agnostic
      const cleanPhoneNumber = patient.phone_number.replace(/\D/g, "").slice(2);
      expect(cleanPhoneNumber).toMatch(/^\d+$/);
      const yearOfBirth =
        patient.date_of_birth?.match(/\d{4}/)?.[0] ??
        String(patient.year_of_birth);

      // Navigate to encounter creation using phone number and year of birth
      await page.goto(`/facility/${facilityId}/patients`);
      await page
        .getByRole("textbox", { name: "Search by Patient Phone Number" })
        .fill(cleanPhoneNumber);

      //select the first result - wait for table body and click the first row
      const firstRow = page.locator('tbody[data-slot="table-body"] tr').first();
      await firstRow.waitFor({ state: "visible" });
      await firstRow.click();

      await page
        .getByRole("textbox", { name: "Year of Birth (YYYY)" })
        .fill(yearOfBirth);

      await page.getByRole("button", { name: "Verify" }).click();

      await expect(
        page.getByRole("button", { name: "Create Encounter" }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Create Encounter" }).click();

      // Use the random encounter type, status and priority selected in beforeEach
      await submitEncounterCreateDialog(page, {
        encounterClass: randomEncounterClass,
        status: randomEncounterStatus,
        priority: randomEncounterPriority,
      });

      //verify on encounter page (a priority can share the class's label,
      //e.g. Emergency; the class comes first in the header)
      await expect(
        page
          .getByRole("region", { name: "Encounter", exact: true })
          .getByText(randomEncounterClass, { exact: true })
          .first(),
      ).toBeVisible();

      // Verify the encounter details through the header's edit link
      await page
        .getByRole("link", { name: "Edit encounter", exact: true })
        .click();

      // Verify encounter status and priority are displayed correctly.
      await expect(
        page.getByRole("combobox").filter({ hasText: randomEncounterStatus }),
      ).toBeVisible();
      await expect(
        page.getByRole("combobox").filter({ hasText: randomEncounterPriority }),
      ).toBeVisible();
    },
  );

  test(
    "creates an encounter with the chosen class, status and priority",
    { tag: ["@atomic", "@cap:encounter.create"] },
    async ({ page, request, facilityId, isolatedPatient }) => {
      const { patientId } = isolatedPatient;

      const { encounterId } = await createEncounterViaUi(page, {
        facilityId,
        patientId,
        encounterClass: randomEncounterClass,
        status: randomEncounterStatus,
        priority: randomEncounterPriority,
      });

      await test.step("The encounter page shows the chosen class and status", async () => {
        await expect(page).toHaveURL(
          (url) =>
            url.pathname ===
            `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
        );
        const header = page.getByRole("region", {
          name: "Encounter",
          exact: true,
        });
        await expect(
          header.getByText(randomEncounterClass, { exact: true }).first(),
        ).toBeVisible();
        await expect(
          header.getByRole("button", {
            name: `Status History: ${randomEncounterStatus}`,
            exact: true,
          }),
        ).toBeVisible();
      });

      await test.step("The encounter is saved with the chosen values", async () => {
        const response = await request.get(
          `${getApiUrl()}/api/v1/encounter/${encounterId}/`,
          { headers: getApiHeaders() },
        );
        await expect(response).toBeOK();
        const encounter: EncounterRead = await response.json();
        expect(encounter.encounter_class).toBe(
          ENCOUNTER_CLASS_CODES[randomEncounterClass],
        );
        expect(encounter.status).toBe(
          ENCOUNTER_STATUS_CODES[randomEncounterStatus],
        );
        expect(encounter.priority).toBe(
          ENCOUNTER_PRIORITY_CODES[randomEncounterPriority],
        );
      });
    },
  );
});
