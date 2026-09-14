import { faker } from "@faker-js/faker";
import { type Page, expect, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

// Use the authenticated state
test.use({ storageState: "tests/.auth/user.json" });
let facilityId: string;
let patientId: string;
let encounterId: string;
let diagnosisName: string;
let questionnaireUrl: string;
let status: string;
let verification: string;
let severity: string;
const usedDiagnoses = new Set<string>(); // To track used diagnoses across tests so we don't add duplicate diagnoses

const diagnosisOptions = [
  "Chronic nontraumatic intracranial subdural haematoma",
  "Malignant melanoma of skin of left wrist",
  "Born in Nauru",
  "Chronic respiratory failure due to obstructive sleep apnoea",
  "Difficulty controlling anger",
  "Lack of trust",
  "Acquired arteriovenous malformation of vascular structure of gastrointestinal tract",
  "Venous ulcer of left ankle",
  "Feeling angry",
  "Fetal heart sounds quiet",
  "Small bowel enteroscopy normal",
  "Ear smelly",
  "Cholera",
  "Osteonecrosis",
  "Chronic pain",
];

const DIAGNOSIS_CLINICAL_STATUS = [
  "Active",
  "Recurrence",
  "Relapse",
  "Inactive",
  "Remission",
  "Resolved",
];

const DIAGNOSIS_VERIFICATION_STATUS = [
  "Unconfirmed",
  "Provisional",
  "Differential",
  "Confirmed",
  "Refuted",
];

const DIAGNOSIS_SEVERITY = ["Mild", "Moderate", "Severe"];

interface DiagnosisRecord {
  code: { display: string };
}

/** The diagnoses truly on this encounter right now, by display text —
 *  read from the backend rather than trusted from an in-memory Set, which
 *  reflects only what THIS worker has picked and says nothing about a
 *  dirty encounter or what a sibling worker did under fullyParallel. */
async function fetchExistingDiagnosisDisplays(
  patientId: string,
  encounterId: string,
): Promise<Set<string>> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/patient/${patientId}/diagnosis/?encounter=${encounterId}&limit=100`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) {
    throw new Error(`Failed to list diagnoses: ${res.status}`);
  }
  const { results } = (await res.json()) as { results: DiagnosisRecord[] };
  return new Set(results.map((d) => d.code.display));
}

async function addDiagnosis(page: Page, severity?: string) {
  await page
    .getByRole("combobox")
    .filter({ hasText: /Add (another )?Diagnosis/i })
    .click();
  await page.getByPlaceholder(/Add (another )?Diagnosis/i).fill(diagnosisName);
  await page.getByRole("option", { name: diagnosisName, exact: true }).click();

  const diagnosisRow = page.getByRole("row", { name: diagnosisName });

  if (severity) {
    await diagnosisRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
  }
}

test.describe("Diagnosis", () => {
  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();

    const availableDiagnosesOptions = diagnosisOptions.filter(
      (d) => !usedDiagnoses.has(d),
    );
    diagnosisName = faker.helpers.arrayElement(availableDiagnosesOptions);
    usedDiagnoses.add(diagnosisName);

    status = faker.helpers.arrayElement(DIAGNOSIS_CLINICAL_STATUS);
    verification = faker.helpers.arrayElement(DIAGNOSIS_VERIFICATION_STATUS);
    severity = faker.helpers.arrayElement(DIAGNOSIS_SEVERITY);

    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/diagnosis`;
    await page.goto(questionnaireUrl);
  });

  test("should add diagnosis with all fields and verify it appears in diagnosis history", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");

    await addDiagnosis(page);

    const diagnosisRow = page.getByRole("row", { name: diagnosisName });

    await diagnosisRow.getByRole("cell").nth(2).click();
    await page.getByRole("option", { name: status, exact: true }).click();

    await diagnosisRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: severity, exact: true }).click();

    await diagnosisRow.getByRole("cell").nth(4).click();
    await page.getByRole("option", { name: verification, exact: true }).click();

    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.getByRole("button", { name: "Diagnosis History" }).click();

    const historyDialog = page.getByRole("dialog", { name: "Past Diagnoses" });
    await historyDialog.waitFor({ state: "visible" });

    // Each date group renders its OWN <tbody data-slot="table-body">
    // (HistoricalRecordSelector/index.tsx) — a locator over that selector
    // alone strict-mode-violates the moment records span more than one
    // day. Target the specific row for the diagnosis JUST added instead.
    const diagnosisHistoryRow = historyDialog
      .locator("tr")
      .filter({ hasText: diagnosisName })
      .filter({ hasText: status });

    await expect(diagnosisHistoryRow.first()).toBeVisible();
    await expect(diagnosisHistoryRow.first()).toContainText(diagnosisName);
    await expect(diagnosisHistoryRow.first()).toContainText(status);
    await expect(diagnosisHistoryRow.first()).toContainText(severity);
    await expect(diagnosisHistoryRow.first()).toContainText(verification);
  });

  test("verify duplicate diagnosis cannot be added", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Pick data-aware rather than trusting the module-level `usedDiagnoses`
    // Set: that Set only reflects picks made by THIS worker, so it's blind
    // to a dirty encounter (leftover diagnoses from an earlier run) and to
    // whatever a sibling worker is doing under fullyParallel — either way
    // it can hand back a name that's already on the encounter for the
    // "add" step (turning it into an accidental duplicate) or a name that
    // was never actually added (turning the "duplicate" step into a
    // false negative). Ask the encounter itself instead.
    const existingDisplays = await fetchExistingDiagnosisDisplays(
      patientId,
      encounterId,
    );
    const availableOptions = diagnosisOptions.filter(
      (d) => !existingDisplays.has(d),
    );
    if (availableOptions.length === 0) {
      throw new Error(
        "No unused diagnosis option left to add — every candidate is already on this encounter",
      );
    }
    const newDiagnosisName = faker.helpers.arrayElement(availableOptions);
    usedDiagnoses.add(newDiagnosisName);

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Diagnosis/i })
      .click();
    await page
      .getByPlaceholder(/Add (another )?Diagnosis/i)
      .fill(newDiagnosisName);
    await page
      .getByRole("option", { name: newDiagnosisName, exact: true })
      .click();
    await page.getByRole("button", { name: "Save Changes" }).click();

    await expect(
      page.getByText("Questionnaire submitted successfully"),
    ).toBeVisible();

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    // `newDiagnosisName` is now guaranteed present on the encounter — no
    // need to guess a second one, and no reliance on any other test
    // (in this worker or another) having run first.
    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Diagnosis/i })
      .click();
    await page
      .getByPlaceholder(/Add (another )?Diagnosis/i)
      .fill(newDiagnosisName);
    await page
      .getByRole("option", { name: newDiagnosisName, exact: true })
      .click();

    await expect(
      page
        .getByRole("region", { name: "Notifications alt+T" })
        .getByRole("listitem")
        .filter({ hasText: "Diagnosis already exists" }),
    ).toBeVisible();
  });

  test("add and display diagnosis with severity", async ({ page }) => {
    await addDiagnosis(page, "severe");

    const diagnosisRow = page
      .locator("div")
      .filter({ hasText: /^DiagnosisStatusSeverityVerificationOnset/ })
      .nth(1);
    await expect(diagnosisRow).toBeVisible();
    await expect(diagnosisRow.getByText("Status")).toBeVisible();
    await expect(diagnosisRow.getByText("Severity")).toBeVisible();
    await expect(diagnosisRow.getByText("Verification")).toBeVisible();
    await expect(diagnosisRow.getByText("Onset")).toBeVisible();

    await expect(diagnosisRow.getByText(diagnosisName)).toBeVisible();
  });
});
