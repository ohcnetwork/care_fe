import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getApiHeaders, getApiUrl } from "tests/helper/utils";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

interface ProcedureRecord {
  id: string;
  status: string;
  outcome: string | null;
  note: string | null;
  code: { display: string };
  occurrence: { occurrence_string?: string | null };
  body_site: { display: string }[];
}

// Each test draws from its own codes so rows never collide across tests;
// the form lists the newest record first, so `.first()` is this run's row.
const RECORD_PROCEDURES = ["Tonsillectomy", "Cholecystectomy", "Hernia repair"];
const REMOVE_PROCEDURES = ["Colonoscopy", "Total knee replacement"];
const HISTORY_PROCEDURES = ["Caesarean section", "Extraction of cataract"];

const SNOMED_CODES: Record<string, string> = {
  Colonoscopy: "73761001",
  "Total knee replacement": "609588000",
  "Caesarean section": "11466000",
  "Extraction of cataract": "54885007",
};

async function listProcedures(patientId: string, encounterId: string) {
  const res = await fetch(
    `${getApiUrl()}/api/v1/patient/${patientId}/procedure/?encounter=${encounterId}&limit=100`,
    { headers: getApiHeaders() },
  );
  if (!res.ok) throw new Error(`Failed to list procedures: ${res.status}`);
  return ((await res.json()) as { results: ProcedureRecord[] }).results;
}

async function seedProcedure(
  patientId: string,
  encounterId: string,
  display: string,
  note: string,
) {
  const res = await fetch(
    `${getApiUrl()}/api/v1/patient/${patientId}/procedure/upsert/`,
    {
      method: "POST",
      headers: getApiHeaders(),
      body: JSON.stringify({
        datapoints: [
          {
            encounter: encounterId,
            status: "completed",
            code: {
              system: "http://snomed.info/sct",
              code: SNOMED_CODES[display],
              display,
            },
            occurrence: { occurrence_string: "Around 2015" },
            note,
          },
        ],
      }),
    },
  );
  if (!res.ok) throw new Error(`Failed to seed procedure: ${res.status}`);
  return ((await res.json()) as ProcedureRecord[])[0];
}

async function saveForm(page: Page) {
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(
    page.getByText("Questionnaire submitted successfully"),
  ).toBeVisible();
}

test.describe("Procedure Questionnaire", () => {
  let facilityId: string;
  let patientId: string;
  let encounterId: string;
  let questionnaireUrl: string;

  test.beforeEach(() => {
    facilityId = getFacilityId();
    patientId = getPatientId();
    encounterId = getEncounterId();
    questionnaireUrl = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/procedure`;
  });

  test("records a procedure with outcome and details", async ({ page }) => {
    const procedureName = faker.helpers.arrayElement(RECORD_PROCEDURES);
    const note = `Procedure note ${faker.string.alphanumeric(10)}`;

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    await page
      .getByRole("combobox")
      .filter({ hasText: /Add (another )?Procedure/i })
      .click();
    await page
      .getByPlaceholder(/Add (another )?Procedure/i)
      .fill(procedureName);
    await page
      .getByRole("option", { name: procedureName, exact: true })
      .click();

    // New rows are appended last; saved rows load newest first.
    const procedureRow = page.getByRole("row", { name: procedureName }).last();
    await procedureRow.getByRole("cell").nth(3).click();
    await page.getByRole("option", { name: "Successful", exact: true }).click();

    await procedureRow.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Show Details" }).click();

    const detailsRow = procedureRow.locator("xpath=following-sibling::tr[1]");
    await detailsRow.getByPlaceholder("e.g. Around 2015").fill("Around 2015");
    await detailsRow.getByPlaceholder("Enter additional notes").fill(note);
    await detailsRow
      .getByRole("combobox")
      .filter({ hasText: "Select Body Site" })
      .click();
    await page.getByPlaceholder("Select Body Site").fill("Abdomen");
    await page.getByRole("option", { name: "Abdomen", exact: true }).click();
    await expect(
      detailsRow.getByText("Abdomen", { exact: true }),
    ).toBeVisible();

    // A date row would conflict with the approximate description.
    await expect(procedureRow.getByRole("cell").nth(1)).toHaveText(
      "Around 2015",
    );

    await saveForm(page);

    const saved = (await listProcedures(patientId, encounterId)).find(
      (procedure) => procedure.note === note,
    );
    expect(saved).toMatchObject({
      status: "completed",
      outcome: "successful",
      code: { display: procedureName },
      occurrence: { occurrence_string: "Around 2015" },
      body_site: [{ display: "Abdomen" }],
    });
  });

  test("removing a saved procedure marks it entered in error", async ({
    page,
  }) => {
    const procedureName = faker.helpers.arrayElement(REMOVE_PROCEDURES);
    const seeded = await seedProcedure(
      patientId,
      encounterId,
      procedureName,
      `Remove me ${faker.string.alphanumeric(10)}`,
    );

    await page.goto(questionnaireUrl);
    await page.waitForLoadState("networkidle");

    const procedureRow = page.getByRole("row", { name: procedureName }).first();
    await procedureRow.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Remove Procedure" }).click();
    await expect(procedureRow.getByRole("cell").nth(2)).toHaveText(
      "Entered in Error",
    );

    await saveForm(page);

    const removed = (await listProcedures(patientId, encounterId)).find(
      (procedure) => procedure.id === seeded.id,
    );
    expect(removed?.status).toBe("entered_in_error");
  });

  test("lists recorded procedures in clinical history", async ({ page }) => {
    const procedureName = faker.helpers.arrayElement(HISTORY_PROCEDURES);
    await seedProcedure(
      patientId,
      encounterId,
      procedureName,
      `History ${faker.string.alphanumeric(10)}`,
    );

    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/history/procedures`,
    );

    await expect(
      page.getByRole("heading", { name: "Past Procedures" }),
    ).toBeVisible();
    // Cards and the table both render each row; one is hidden per viewport.
    await expect(
      page.getByText(procedureName).filter({ visible: true }).first(),
    ).toBeVisible();
  });
});
