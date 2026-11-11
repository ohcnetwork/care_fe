import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const SYMPTOM_CLINICAL_STATUS = [
  "Active",
  "Recurrence",
  "Relapse",
  "Inactive",
  "Remission",
  "Resolved",
] as const;

const SYMPTOM_SEVERITY = ["Mild", "Moderate", "Severe"] as const;

const SYMPTOM_VERIFICATION_STATUS = [
  "Unconfirmed",
  "Provisional",
  "Differential",
  "Confirmed",
  "Refuted",
] as const;

const symptomOptions = [
  "Chronic pain",
  "Chronic respiratory failure due to obstructive sleep apnoea",
  "Chronic nontraumatic intracranial subdural haematoma",
  "Adenosine deaminase 2 deficiency",
  "Malignant melanoma of skin of left wrist",
  "Small bowel enteroscopy normal",
  "Renal scarring due to vesicoureteral reflux",
  "Venous ulcer of toe of left foot",
  "Acquired arteriovenous malformation of vascular structure of gastrointestinal tract",
  "Venous ulcer of left ankle",
  "Acute left-sided ulcerative colitis",
  "Allergy to hydrogen peroxide",
];
const usedSymptoms = new Set<string>(); // To track used symptoms across tests so we don't add duplicate symptoms

interface SymptomRecord {
  code: { display: string };
}

/** The symptoms truly on this encounter right now, by display text — read
 *  from the backend rather than trusted from an in-memory Set, which
 *  reflects only what THIS worker has picked and says nothing about a
 *  dirty encounter or what a sibling worker did under fullyParallel. */
async function fetchExistingSymptomDisplays(
  patientId: string,
  encounterId: string,
): Promise<Set<string>> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/patient/${patientId}/symptom/?encounter=${encounterId}&limit=100`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    throw new Error(`Failed to list symptoms: ${res.status}`);
  }
  const { results } = (await res.json()) as { results: SymptomRecord[] };
  return new Set(results.map((s) => s.code.display));
}

test.describe("Symptom Questionnaire", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let questionnaireUrl: string;
  let symptomName: string;
  let status: string;
  let verification: string;
  let severity: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();

    const availableSymptomOptions = symptomOptions.filter(
      (d) => !usedSymptoms.has(d),
    );
    symptomName = faker.helpers.arrayElement(availableSymptomOptions);
    usedSymptoms.add(symptomName); //Add to used symptoms to avoid duplicates

    status = faker.helpers.arrayElement(SYMPTOM_CLINICAL_STATUS);
    verification = faker.helpers.arrayElement(SYMPTOM_VERIFICATION_STATUS);
    severity = faker.helpers.arrayElement(SYMPTOM_SEVERITY);

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/symptom`;

    await page.goto(questionnaireUrl);
  });

  test("should add symptom with all fields", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Symptom/i })
      .click();
    await page.getByPlaceholder(/Add (another )?Symptom/i).fill(symptomName);
    await page.getByRole("option", { name: symptomName, exact: true }).click();
    const symptomRow = page.getByRole("row", { name: symptomName });

    await symptomRow.getByRole("cell").nth(2).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    await symptomRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity, exact: true }).click();

    await symptomRow.getByRole("cell").nth(4).click();
    await page.getByRole("option", { name: verification, exact: true }).click();

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.getByRole("button", { name: "Symptom History" }).click();

    const symptomHistoryDialog = page.getByRole("dialog", {
      name: "Past Symptoms",
    });
    await symptomHistoryDialog.waitFor({ state: "visible" });

    // Each date group renders its OWN <tbody data-slot="table-body">
    // (HistoricalRecordSelector/index.tsx) — a locator over that selector
    // alone strict-mode-violates the moment records span more than one
    // day. Target the specific row for the symptom JUST added instead.
    const symptomHistoryRow = symptomHistoryDialog
      .locator("tr")
      .filter({ hasText: symptomName })
      .filter({ hasText: status });

    await expect(symptomHistoryRow.first()).toBeVisible();
    await expect(symptomHistoryRow.first()).toContainText(symptomName);
    await expect(symptomHistoryRow.first()).toContainText(status);
    await expect(symptomHistoryRow.first()).toContainText(severity);
    await expect(symptomHistoryRow.first()).toContainText(verification);
  });

  test("verify duplicate symptom cannot be added", async ({ page }) => {
    // Pick data-aware rather than trusting the module-level `usedSymptoms`
    // Set: that Set only reflects picks made by THIS worker, so it's blind
    // to a dirty encounter (leftover symptoms from an earlier run) and to
    // whatever a sibling worker is doing under fullyParallel — either way
    // it can hand back a name that's already on the encounter for the
    // "add" step (turning it into an accidental duplicate) or a name that
    // was never actually added (turning the "duplicate" step into a false
    // negative). Ask the encounter itself instead.
    const existingDisplays = await fetchExistingSymptomDisplays(
      patientId,
      encounterId,
    );
    const availableOptions = symptomOptions.filter(
      (s) => !existingDisplays.has(s),
    );
    if (availableOptions.length === 0) {
      throw new Error(
        "No unused symptom option left to add — every candidate is already on this encounter",
      );
    }
    const newSymptomName = faker.helpers.arrayElement(availableOptions);
    usedSymptoms.add(newSymptomName);

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Symptom/i })
      .click();
    await page.getByPlaceholder(/Add (another )?Symptom/i).fill(newSymptomName);
    await page
      .getByRole("option", { name: newSymptomName, exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    // `newSymptomName` is now guaranteed present on the encounter — no
    // need to guess a second one, and no reliance on any other test (in
    // this worker or another) having run first.
    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Symptom/i })
      .click();
    await page.getByRole("option").filter({ hasText: newSymptomName }).click();

    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Symptom already exists!" }),
    ).toBeVisible();
  });
});
