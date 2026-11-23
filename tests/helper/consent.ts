import { expect, Page, test } from "@playwright/test";
import { format } from "date-fns";
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
  await test.step(
    "encounter.consent.create",
    async () => {
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
    },
    { box: true },
  );
}

/** App path of an encounter's Consents tab. */
export function consentsTabUrl({
  facilityId,
  patientId,
  encounterId,
}: {
  facilityId: string;
  patientId: string;
  encounterId: string;
}) {
  return `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/consents`;
}

/** Open the "Add Consent" sheet from the Consents tab. */
export async function openAddConsentSheet(page: Page) {
  await page.getByRole("button", { name: /add.*consent/i }).click();
  await expect(
    page.getByRole("heading", { name: "Add Consent" }),
  ).toBeVisible();
}

export interface CreateConsentInput {
  facilityId: string;
  patientId: string;
  encounterId: string;
  /** Decision radio label; the form defaults to "Permit". */
  decision?: "Permit" | "Deny";
  /** Category option label, e.g. "Research"; the form defaults to Treatment. */
  category?: string;
  note?: string;
  validFrom?: Date;
  validUntil?: Date;
}

/**
 * Creates a consent (without files) from the encounter's Consents tab and
 * waits for the success toast. Unset fields keep the form defaults: active,
 * treatment, permit, given now.
 */
export async function createConsentViaUi(
  page: Page,
  {
    facilityId,
    patientId,
    encounterId,
    decision,
    category,
    note,
    validFrom,
    validUntil,
  }: CreateConsentInput,
): Promise<void> {
  await test.step(
    "encounter.consent.create",
    async () => {
      await goToConsentsTab(
        page,
        consentsTabUrl({ facilityId, patientId, encounterId }),
      );
      await openAddConsentSheet(page);

      if (decision) {
        await page.getByRole("radio", { name: decision }).click();
      }
      if (category) {
        await page
          .getByRole("combobox")
          .filter({ hasText: /treatment/i })
          .click();
        await page
          .getByRole("option", { name: new RegExp(`^${category}`, "i") })
          .first()
          .click();
      }
      if (note !== undefined) {
        await page.getByLabel("Note", { exact: true }).fill(note);
      }
      if (validFrom) {
        await page
          .getByLabel("Consent Valid From", { exact: true })
          .fill(format(validFrom, "yyyy-MM-dd'T'HH:mm"));
      }
      if (validUntil) {
        await page
          .getByLabel("Consent Valid Until", { exact: true })
          .fill(format(validUntil, "yyyy-MM-dd'T'HH:mm"));
      }

      await page.getByRole("button", { name: "Save" }).click();
      await expectToast(page, /consent created successfully/i);
    },
    { box: true },
  );
}

/** The upload dialog shown after picking a file on the consent detail page. */
export function consentUploadDialog(page: Page) {
  return page.getByRole("dialog", { name: "Upload File" });
}

/** Pick a file on the consent detail page and wait for the upload dialog. */
export async function pickConsentFileOnDetail(page: Page, filePath: string) {
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expect(consentUploadDialog(page)).toBeVisible();
}

/** Uploads a file with a display name from the open consent detail page. */
export async function uploadConsentFileViaUi(
  page: Page,
  { filePath, displayName }: { filePath: string; displayName: string },
): Promise<void> {
  await test.step(
    "encounter.consent.file.upload",
    async () => {
      await pickConsentFileOnDetail(page, filePath);
      const dialog = consentUploadDialog(page);
      await dialog.getByLabel("File Name").fill(displayName);

      const uploadResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/files/") &&
          response.request().method() === "POST",
      );
      await dialog.getByRole("button", { name: "Upload" }).click();
      expect((await uploadResponse).ok()).toBe(true);
      await expect(dialog).toBeHidden();
    },
    { box: true },
  );
}
