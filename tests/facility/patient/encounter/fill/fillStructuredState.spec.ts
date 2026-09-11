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

for (const encounterClass of ["amb", "imp"]) {
  test(`encounter edits survive remount with immutable class and preserved terminal period (${encounterClass})`, async ({
    page,
  }) => {
    const periodEnd = "2025-01-02T00:00:00Z";
    const response = await page.request.get(
      `${apiBaseUrl()}/api/v1/encounter/${getEncounterId()}/`,
      {
        headers: adminApiHeaders(),
        params: { facility: getFacilityId() },
      },
    );
    expect(response.ok()).toBe(true);
    const encounter = await response.json();
    await page.route(
      (url) => url.pathname === `/api/v1/encounter/${getEncounterId()}/`,
      (route) =>
        route.fulfill({
          json: {
            ...encounter,
            encounter_class: encounterClass,
            status: "cancelled",
            period: { start: "2025-01-01T00:00:00Z", end: periodEnd },
          },
        }),
    );
    // Assert the merged update contract without changing the fixture encounter.
    await page.route("**/api/v1/batch_requests/", (route) =>
      route.fulfill({ json: { results: [] } }),
    );
    await openConditionalSection(page, "encounter");
    const section = questionBlock(page, SECTION_LABEL);
    await expect(
      section.getByText("Encounter Class", { exact: true }),
    ).toHaveCount(0);
    await expect(
      section.getByText("Hospitalization Details", { exact: true }),
    ).toHaveCount(encounterClass === "imp" ? 1 : 0);
    await expect(
      section.getByRole("button", { name: "Mark for discharge", exact: true }),
    ).toHaveCount(encounterClass === "imp" ? 1 : 0);

    await section
      .getByRole("combobox")
      .filter({ hasText: "Cancelled" })
      .click();
    for (const unavailableStatus of ["Completed", "Unknown", "Discharged"]) {
      await expect(
        page.getByRole("option", { name: unavailableStatus, exact: true }),
      ).toHaveCount(0);
    }
    await page.getByRole("option", { name: "Cancelled", exact: true }).click();

    const identifier = section.getByPlaceholder("Ip/op/obs/emr number", {
      exact: true,
    });
    const editedIdentifier = `REMOUNT-${faker.string.alphanumeric(8)}`;
    await identifier.fill(editedIdentifier);
    await remountSection(page);
    await expect(identifier).toHaveValue(editedIdentifier);

    const batchRequest = page.waitForRequest(
      (request) =>
        request.url().includes("/api/v1/batch_requests/") &&
        request.method() === "POST",
    );
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    const body = (await batchRequest).postDataJSON() as {
      requests: { url: string; body: Record<string, unknown> }[];
    };
    const encounterRequest = body.requests.find(
      (request) => request.url === `/api/v1/encounter/${getEncounterId()}/`,
    );
    expect(encounterRequest?.body).toMatchObject({
      status: "cancelled",
      period: { end: periodEnd },
      external_identifier: editedIdentifier,
    });
    expect(encounterRequest?.body).not.toHaveProperty("encounter_class");
    if (encounterClass === "amb") {
      expect(encounterRequest?.body.hospitalization).toEqual({});
    }
    await page.waitForURL(/\/updates$/);
  });
}

test("old encounter drafts drop incompatible class edits while retaining clinician edits and refreshed server fields", async ({
  page,
}) => {
  const response = await page.request.get(
    `${apiBaseUrl()}/api/v1/encounter/${getEncounterId()}/`,
    { headers: adminApiHeaders(), params: { facility: getFacilityId() } },
  );
  expect(response.ok()).toBe(true);
  const encounter = await response.json();
  let serverPriority = "routine";
  await page.route(
    (url) => url.pathname === `/api/v1/encounter/${getEncounterId()}/`,
    (route) =>
      route.fulfill({
        json: {
          ...encounter,
          encounter_class: "amb",
          status: "in_progress",
          priority: serverPriority,
          hospitalization: {},
          external_identifier: "Server identifier",
          discharge_summary_advice: null,
        },
      }),
  );
  await page.route("**/api/v1/batch_requests/", (route) =>
    route.fulfill({ json: { results: [] } }),
  );
  page.on("dialog", (dialog) => dialog.accept());
  await openConditionalSection(page, "encounter");
  const fillUrl = page.url();
  const questionnaireId = new URL(fillUrl).pathname.split("/").at(-1)!;
  const section = questionBlock(page, SECTION_LABEL);
  const identifier = section.getByPlaceholder("Ip/op/obs/emr number", {
    exact: true,
  });
  const draftedIdentifier = `OLD-DRAFT-${faker.string.alphanumeric(8)}`;
  const draftedAdvice = "Retain this clinician discharge advice";
  await identifier.fill(draftedIdentifier);
  const findDraftKey = () =>
    page.evaluate(
      (id) =>
        Object.keys(localStorage).find(
          (key) =>
            key.startsWith("care_qn_fill_draft--") && key.endsWith(`--${id}`),
        ),
      questionnaireId,
    );
  await expect.poll(findDraftKey).toBeTruthy();
  const draftKey = (await findDraftKey())!;

  // Let the provider flush before rewriting the saved snapshot to the old
  // editable-class shape. Returning to the form uses the actual Resume path.
  const updatesUrl = `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/updates`;
  await page.goto(updatesUrl);
  await page.evaluate(
    ({ key, advice }) => {
      const draft = JSON.parse(localStorage.getItem(key)!);
      for (const form of draft.forms) {
        for (const saved of Object.values(form.responses) as {
          structured_type?: string;
          values: { value: Record<string, unknown>[] }[];
          draft_context: { value: Record<string, unknown>[] }[];
        }[]) {
          if (saved.structured_type !== "encounter") continue;
          saved.draft_context[0].value[0].encounter_class = "amb";
          Object.assign(saved.values[0].value[0], {
            encounter_class: "imp",
            hospitalization: { diet_preference: "vegetarian" },
            discharge_summary_advice: advice,
          });
        }
      }
      localStorage.setItem(key, JSON.stringify(draft));
    },
    { key: draftKey, advice: draftedAdvice },
  );
  serverPriority = "urgent";
  await page.goto(fillUrl);
  await expect(page.getByText(/unsaved entry from/i)).toBeVisible();
  await page.getByRole("button", { name: /resume/i }).click();
  await expect(identifier).toHaveValue(draftedIdentifier);
  await expect(
    section.getByPlaceholder("Enter the discharge summary advice"),
  ).toHaveValue(draftedAdvice);
  await expect(
    section.getByRole("combobox").filter({ hasText: "Urgent" }),
  ).toBeVisible();
  await expect(
    section.getByText("Hospitalization Details", { exact: true }),
  ).toHaveCount(0);
  await remountSection(page);
  await expect(identifier).toHaveValue(draftedIdentifier);

  // Rebased server context must also be clean; otherwise a later remount can
  // interpret the removed class as a new clinician edit and resurrect it.
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        return raw ? raw.includes('"encounter_class"') : true;
      }, draftKey),
    )
    .toBe(false);
  const batchRequest = page.waitForRequest(
    (request) =>
      request.url().includes("/api/v1/batch_requests/") &&
      request.method() === "POST",
  );
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  const body = (await batchRequest).postDataJSON() as {
    requests: { url: string; body: Record<string, unknown> }[];
  };
  const encounterRequest = body.requests.find(
    (request) => request.url === `/api/v1/encounter/${getEncounterId()}/`,
  );
  expect(encounterRequest?.body).toMatchObject({
    external_identifier: draftedIdentifier,
    discharge_summary_advice: draftedAdvice,
    priority: "urgent",
  });
  expect(encounterRequest?.body.hospitalization).toEqual({});
  expect(encounterRequest?.body).not.toHaveProperty("encounter_class");
  await page.waitForURL(/\/updates$/);
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
  // Production asks before leaving a dirty form. Accept the navigation so
  // each query-only change actually opens the next prescription's scope.
  page.on("dialog", (dialog) => dialog.accept());
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
