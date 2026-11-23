import { test as base, expect } from "@playwright/test";
import { createTestEncounter } from "tests/helper/encounter";
import { createTestPatient } from "tests/helper/patient";
import { getFacilityId } from "tests/support/facilityId";

interface IsolatedPatient {
  patientId: string;
}

interface IsolatedEncounter {
  patientId: string;
  encounterId: string;
}

interface DataFixtures {
  /** The shared "Facility with Patient" fixture facility from the setup project. */
  facilityId: string;
  /**
   * A throwaway patient created through the API for this test only. Use it
   * instead of the shared fixture patient whenever the test writes data.
   */
  isolatedPatient: IsolatedPatient;
  /**
   * A throwaway patient with its own in-progress ambulatory encounter. Use it
   * instead of the shared fixture encounter, or "the first in-progress
   * encounter in the list", whenever the test writes to the encounter.
   */
  isolatedEncounter: IsolatedEncounter;
}

/**
 * `test` with per-test data fixtures. Import it from here instead of
 * `@playwright/test` when a test needs data of its own:
 *
 *   test("…", async ({ page, isolatedEncounter }) => { … });
 *
 * Fixtures are created lazily, only for tests that ask for them.
 */
export const test = base.extend<DataFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixtures with no dependencies take an empty object pattern
  facilityId: async ({}, use) => {
    await use(getFacilityId());
  },
  // eslint-disable-next-line no-empty-pattern -- see above
  isolatedPatient: async ({}, use) => {
    await use({ patientId: await createTestPatient() });
  },
  isolatedEncounter: async ({ facilityId }, use) => {
    const patientId = await createTestPatient();
    const encounterId = await createTestEncounter(facilityId, patientId);
    await use({ patientId, encounterId });
  },
});

export { expect };
