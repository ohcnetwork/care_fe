import { faker } from "@faker-js/faker";
import { expect, type Page, test } from "@playwright/test";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

const TOGGLE_LABEL = "Show clinical section";
const SECTION_LABEL = "Clinical section";

async function openConditionalSection(page: Page, structuredType: string) {
  const suffix = faker.string.alphanumeric(12).toLowerCase();
  const response = await fetch(`${apiBaseUrl()}/api/v1/questionnaire/`, {
    method: "POST",
    headers: adminApiHeaders(),
    body: JSON.stringify({
      title: `E2E Structured State ${suffix}`,
      slug: `e2e-structured-state-${suffix}`,
      status: "active",
      subject_type: "encounter",
      auth_context: "instance",
      questions: [
        {
          id: faker.string.uuid(),
          link_id: "SHOW",
          text: TOGGLE_LABEL,
          type: "boolean",
          required: false,
          questions: [],
        },
        {
          id: faker.string.uuid(),
          link_id: "SECTION",
          text: SECTION_LABEL,
          type: "structured",
          structured_type: structuredType,
          required: false,
          enable_when: [{ question: "SHOW", operator: "equals", answer: true }],
          questions: [],
        },
      ],
    }),
  });
  expect(response.ok, await response.clone().text()).toBeTruthy();
  const questionnaire = (await response.json()) as { id: string };
  await page.goto(
    `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/${questionnaire.id}`,
  );
  await questionBlock(page, TOGGLE_LABEL)
    .getByRole("radio", { name: "Yes", exact: true })
    .click();
  await expect(questionBlock(page, SECTION_LABEL)).toBeVisible();
}

async function remountSection(page: Page) {
  const toggle = questionBlock(page, TOGGLE_LABEL);
  await toggle.getByRole("radio", { name: "No", exact: true }).click();
  await expect(questionBlock(page, SECTION_LABEL)).toHaveCount(0);
  await toggle.getByRole("radio", { name: "Yes", exact: true }).click();
  await expect(questionBlock(page, SECTION_LABEL)).toBeVisible();
}

test("file names and selections survive conditional remount and adding another file", async ({
  page,
}) => {
  await openConditionalSection(page, "files");
  const section = questionBlock(page, SECTION_LABEL);
  await section.locator('input[type="file"]').setInputFiles({
    name: "first.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("first attachment"),
  });
  const names = section.getByPlaceholder("File Name", { exact: true });
  await names.first().fill("Original attachment");
  await remountSection(page);
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveValue("Original attachment");
  await section.locator('input[type="file"]').setInputFiles({
    name: "second.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("second attachment"),
  });
  await expect(names).toHaveCount(2);
  await expect(names.first()).toHaveValue("Original attachment");
  await expect(section.getByText("first.txt", { exact: true })).toBeVisible();
  await expect(section.getByText("second.txt", { exact: true })).toBeVisible();
});

test("encounter edits survive conditional remount without resetting from the cached encounter", async ({
  page,
}) => {
  await openConditionalSection(page, "encounter");
  const identifier = questionBlock(page, SECTION_LABEL).getByPlaceholder(
    "Ip/op/obs/emr number",
    { exact: true },
  );
  const editedIdentifier = `REMOUNT-${faker.string.alphanumeric(8)}`;
  await identifier.fill(editedIdentifier);
  await remountSection(page);
  await expect(identifier).toHaveValue(editedIdentifier);
});

test("diagnosis edits survive remount and local draft recovery while fresh server fields are reconciled", async ({
  page,
}) => {
  let serverSeverity = "moderate";
  const diagnosisId = faker.string.uuid();
  await page.route(
    `**/api/v1/patient/${getPatientId()}/diagnosis/**`,
    async (route) => {
      await route.fulfill({
        json: {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: diagnosisId,
              code: {
                code: "E2E-DRAFT",
                system: "test",
                display: "Draft recovery diagnosis",
              },
              clinical_status: "active",
              verification_status: "confirmed",
              severity: serverSeverity,
              category: "encounter_diagnosis",
              onset: { onset_datetime: "2025-01-01" },
              note: "Initial server note",
              encounter: getEncounterId(),
              created_date: "2025-01-01T00:00:00Z",
            },
          ],
        },
      });
    },
  );
  await openConditionalSection(page, "diagnosis");
  const section = questionBlock(page, SECTION_LABEL);
  const note = section.getByRole("textbox", {
    name: "Enter additional notes",
    exact: true,
  });
  await expect(note).toHaveValue("Initial server note");
  await note.fill("Unsaved clinician note");
  await remountSection(page);
  await expect(note).toHaveValue("Unsaved clinician note");

  serverSeverity = "severe";
  await page.reload();
  await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
  await page.getByRole("button", { name: /resume/i }).click();
  await expect(note).toHaveValue("Unsaved clinician note");
  await expect(
    section
      .getByRole("row", { name: /Draft recovery diagnosis/ })
      .getByRole("combobox")
      .nth(1),
  ).toHaveText("Severe");
});

test("charge rows and quantities survive remount and local draft recovery", async ({
  page,
}) => {
  const definition = {
    id: faker.string.uuid(),
    slug: "e2e-draft-charge",
    title: "Draft recovery charge",
    status: "active",
    price_components: [],
    category: null,
    tags: [],
  };
  await page.route(
    `**/api/v1/facility/${getFacilityId()}/charge_item_definition/**`,
    async (route) => {
      await route.fulfill({
        json: new URL(route.request().url()).pathname.endsWith(
          `/${definition.slug}/`,
        )
          ? definition
          : { count: 1, results: [definition] },
      });
    },
  );
  await openConditionalSection(page, "charge_item");
  const section = questionBlock(page, SECTION_LABEL);
  await section
    .getByRole("combobox")
    .filter({ hasText: /Add charges/ })
    .click();
  await page.getByRole("dialog").getByRole("combobox").fill(definition.title);
  await page
    .getByRole("option", { name: definition.title, exact: true })
    .click();
  const row = section.getByRole("row", { name: /Draft recovery charge/ });
  const quantity = row.getByRole("spinbutton");
  await quantity.fill("3");
  await remountSection(page);
  await expect(quantity).toHaveValue("3");
  await page.reload();
  await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
  await page.getByRole("button", { name: /resume/i }).click();
  await expect(quantity).toHaveValue("3");
});

test("prescription drafts stay isolated across A, B, and new-prescription query changes", async ({
  page,
}) => {
  const prescriptionA = faker.string.uuid();
  const prescriptionB = faker.string.uuid();
  const medicationA = faker.string.uuid();
  const medicationB = faker.string.uuid();
  const fillPath = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/questionnaire/medication_request`;

  await page.route(
    `**/api/v1/patient/${getPatientId()}/medication/request/**`,
    async (route) => {
      const prescription = new URL(route.request().url()).searchParams.get(
        "prescription",
      );
      const label = prescription === prescriptionA ? "A" : "B";
      await route.fulfill({
        json: {
          count: 1,
          results: [
            {
              id: label === "A" ? medicationA : medicationB,
              medication: {
                code: `RX-${label}`,
                system: "test",
                display: `Prescription ${label} medication`,
              },
              status: "active",
              intent: "order",
              category: "outpatient",
              priority: "routine",
              do_not_perform: false,
              dosage_instruction: [{ as_needed_boolean: false }],
              authored_on: "2025-01-01T00:00:00Z",
              note: `Server note ${label}`,
            },
          ],
        },
      });
    },
  );
  await page.route(
    `**/api/v1/patient/${getPatientId()}/medication/prescription/**`,
    async (route) => {
      await route.fulfill({ json: { status: "active", medications: [] } });
    },
  );

  const section = questionBlock(page, "Medication Request");
  const note = section.getByPlaceholder("Enter additional notes", {
    exact: true,
  });
  const navigateInPlace = async (prescription?: string) => {
    // Exercise the router's query-only navigation without a document reload:
    // the previous form provider must unmount and flush its own draft scope.
    await page.evaluate(
      (path) => {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      },
      `${fillPath}${prescription ? `?prescription=${prescription}` : ""}`,
    );
  };

  await page.goto(`${fillPath}?prescription=${prescriptionA}`);
  await expect(note).toHaveValue("Server note A");
  await note.fill("Unsaved prescription A note");

  await navigateInPlace(prescriptionB);
  await expect(note).toHaveValue("Server note B");
  await expect(
    section.getByText("Prescription A medication", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/unsaved entry from/i)).toHaveCount(0);
  await note.fill("Unsaved prescription B note");

  await navigateInPlace();
  await expect(note).toHaveCount(0);
  await expect(section.getByText(/Prescription [AB] medication/)).toHaveCount(
    0,
  );
  await expect(page.getByText(/unsaved entry from/i)).toHaveCount(0);

  for (const [prescription, label] of [
    [prescriptionA, "A"],
    [prescriptionB, "B"],
  ]) {
    await navigateInPlace(prescription);
    await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
    await page.getByRole("button", { name: /resume/i }).click();
    await expect(note).toHaveValue(`Unsaved prescription ${label} note`);
    await expect(
      section.getByText(
        `Prescription ${label === "A" ? "B" : "A"} medication`,
        { exact: true },
      ),
    ).toHaveCount(0);
  }
});
