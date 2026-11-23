import { expect, Page } from "@playwright/test";
import { createTestEncounter } from "tests/helper/encounter";
import { createTestPatient } from "tests/helper/patient";
import { adminApiHeaders, apiBaseUrl } from "tests/helper/questionnaireV2";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

export interface ConsentEncounter {
  patientId: string;
  encounterId: string;
  /** App path of the encounter's Consents tab. */
  consentsUrl: string;
}

export interface ConsentFile {
  path: string;
  name: string;
}

/**
 * Creates a throwaway patient and encounter through the API, so the consents a
 * test creates are the only ones on the Consents tab. This keeps consent specs
 * safe under fullyParallel and independent of each other.
 */
export async function createConsentEncounter(
  patientNamePrefix = "Consent",
): Promise<ConsentEncounter> {
  const facilityId = getFacilityId();
  const patientId = await createTestPatient(patientNamePrefix);
  const encounterId = await createTestEncounter(facilityId, patientId);
  return {
    patientId,
    encounterId,
    consentsUrl: `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/consents`,
  };
}

/**
 * Creates an active, permitted treatment consent (without files) through the
 * API. Use it for setup that isn't the behaviour under test, e.g. filling a
 * list past its page size.
 */
export async function createTestConsent({
  patientId,
  encounterId,
}: ConsentEncounter): Promise<string> {
  const now = new Date().toISOString();
  const response = await fetch(
    `${apiBaseUrl()}/api/v1/patient/${patientId}/consent/`,
    {
      method: "POST",
      headers: adminApiHeaders(),
      body: JSON.stringify({
        status: "active",
        category: "treatment",
        decision: "permit",
        date: now,
        period: { start: now },
        encounter: encounterId,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to create test consent: ${response.status} — ${await response.text()}`,
    );
  }
  return ((await response.json()) as { id: string }).id;
}

/** Navigate to a Consents tab and wait for it to be ready. */
export async function goToConsentsTab(page: Page, consentsUrl: string) {
  await page.goto(consentsUrl);
  await expect(
    page.getByRole("button", { name: /add.*consent/i }),
  ).toBeVisible();
}

/**
 * Consent cards on the Consents tab. Other cards on the page also use
 * data-slot="card", so keep only those with a "See Details" action.
 */
export function consentCards(page: Page) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("button", { name: "See Details" }) });
}

/**
 * Create a consent from the Add Consent sheet, attaching the given files. The
 * sheet renders one inline "File Name" field per attached file; names are
 * required (no fallback to the original filename).
 */
export async function createConsentWithFiles(page: Page, files: ConsentFile[]) {
  await page.getByRole("button", { name: /add.*consent/i }).click();
  const sheet = page.getByRole("dialog", { name: "Add Consent" });
  await expect(sheet).toBeVisible();

  if (files.length > 0) {
    await sheet
      .locator('input[type="file"]')
      .setInputFiles(files.map((f) => f.path));
    const nameFields = sheet.getByPlaceholder("File Name", { exact: true });
    await expect(nameFields).toHaveCount(files.length);
    for (const [index, file] of files.entries()) {
      await nameFields.nth(index).fill(file.name);
    }
  }

  await sheet.getByRole("button", { name: "Save" }).click();
  await expectToast(page, /consent created successfully/i);
  await expect(sheet).toBeHidden();
}
