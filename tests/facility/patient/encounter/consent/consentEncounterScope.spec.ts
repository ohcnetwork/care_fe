import { expect, type Page, test } from "@playwright/test";
import { createTestEncounter } from "tests/helper/encounter";
import { createTestPatient } from "tests/helper/patient";
import { expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * A consent belongs to the encounter it was created in. The consents API is
 * patient-scoped (/patient/{id}/consent/) and the tab filters it by
 * encounter, so a consent must never show up in another encounter of the
 * same patient.
 *
 * Each test creates its own patient with two active encounters, so both
 * lists start empty. This keeps the suite safe under fullyParallel and
 * independent of consentCreation.spec.ts, which writes to the shared fixture
 * encounter.
 */
let facilityId: string;
let patientId: string;
let encounterA: string;
let encounterB: string;

/** Navigate to an encounter's Consents tab and wait until it is loaded. */
async function goToConsentsTab(page: Page, encounterId: string) {
  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/consents`,
  );
  await expect(
    page.getByRole("button", { name: /add.*consent/i }),
  ).toBeVisible();
}

/** Consent cards on the tab (other cards also use data-slot="card"). */
function consentCards(page: Page) {
  return page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("button", { name: "See Details" }) });
}

/**
 * Create a consent from the Add Consent sheet. Without a category, the
 * consent keeps the default (Treatment).
 */
async function createConsent(page: Page, category?: string) {
  await page.getByRole("button", { name: /add.*consent/i }).click();
  const sheet = page.getByRole("dialog", { name: "Add Consent" });
  await expect(sheet).toBeVisible();

  if (category) {
    await sheet
      .getByRole("combobox")
      .filter({ hasText: /treatment/i })
      .click();
    // Each option's name also includes the category description.
    await page
      .getByRole("option", { name: new RegExp(`^${category}`) })
      .click();
  }

  await sheet.getByRole("button", { name: "Save" }).click();
  await expectToast(page, /consent created successfully/i);
  await expect(sheet).toBeHidden();
}

test.describe("Consent encounter scope", () => {
  test.beforeEach(async () => {
    facilityId = getFacilityId();
    patientId = await createTestPatient("Consent Scope");
    encounterA = await createTestEncounter(facilityId, patientId);
    encounterB = await createTestEncounter(facilityId, patientId);
  });

  test("consent created in encounter A is not listed in encounter B of the same patient", async ({
    page,
  }) => {
    await goToConsentsTab(page, encounterA);
    await createConsent(page);
    await expect(consentCards(page)).toHaveCount(1);

    await goToConsentsTab(page, encounterB);
    await expect(page.getByText("No Consents found")).toBeVisible();
    await expect(consentCards(page)).toHaveCount(0);
  });

  test("consents created in encounters A and B are each listed only in their own encounter", async ({
    page,
  }) => {
    await goToConsentsTab(page, encounterA);
    await createConsent(page);

    await goToConsentsTab(page, encounterB);
    await createConsent(page, "Research");

    // Reload each tab so the assertions read a freshly fetched list.
    await goToConsentsTab(page, encounterB);
    await expect(consentCards(page)).toHaveCount(1);
    await expect(
      consentCards(page).getByText("RESEARCH", { exact: true }),
    ).toBeVisible();
    await expect(
      consentCards(page).getByText("TREATMENT", { exact: true }),
    ).toHaveCount(0);

    await goToConsentsTab(page, encounterA);
    await expect(consentCards(page)).toHaveCount(1);
    await expect(
      consentCards(page).getByText("TREATMENT", { exact: true }),
    ).toBeVisible();
    await expect(
      consentCards(page).getByText("RESEARCH", { exact: true }),
    ).toHaveCount(0);
  });
});
