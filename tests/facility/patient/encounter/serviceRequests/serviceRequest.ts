import { faker } from "@faker-js/faker";
import { expect, test, type Page } from "@playwright/test";
import { BODY_SITES, KNOWN_USERNAMES } from "tests/helper/commonConstants";
import { submitAndExpectSuccess } from "tests/helper/questionnaire";
import {
  adminApiHeaders,
  apiBaseUrl,
  questionBlock,
} from "tests/helper/questionnaireV2";
import {
  clickTabOrMenuItem,
  expectToast,
  selectComboboxOption,
  selectFromCommand,
  selectFromValueSet,
} from "tests/helper/ui";

import type { ActivityDefinitionReadSpec } from "../../../../../src/types/emr/activityDefinition/activityDefinition";
import type {
  ObservationDefinitionCreate,
  ObservationDefinitionRead,
} from "../../../../../src/types/emr/observationDefinition/observationDefinition";

export const ACTIVITY_DEFINITIONS = [
  "Urinalysis",
  "Lipid Panel",
  "Fasting Blood Glucose",
];

export const PRIORITIES = ["Routine", "Urgent", "ASAP", "Stat"];

export interface ServiceRequestTestData {
  activityDefinition: string;
  priority: string;
  navigateCategories: string[];
  status: string;
  bodySite?: string;
  patientInstruction?: string;
  notes?: string;
  requestor?: string;
}

export type ServiceRequestOverrides = Partial<
  Pick<ServiceRequestTestData, "activityDefinition" | "priority">
>;

/**
 * The report type picker preselects the only remaining report code, so the
 * placeholder is not always shown. Locate the picker by its label instead.
 */
export function reportTypeCombobox(page: Page) {
  return page.getByRole("combobox", {
    name: "Select Diagnostic Report Type",
    exact: true,
  });
}

export function generateServiceRequestTestData(
  allFields: boolean = false,
): ServiceRequestTestData {
  const data: ServiceRequestTestData = {
    activityDefinition: faker.helpers.arrayElement(ACTIVITY_DEFINITIONS),
    priority: faker.helpers.arrayElement(PRIORITIES),
    navigateCategories: ["Lab Tests"],
    status: "Active",
  };

  if (allFields) {
    return {
      ...data,
      bodySite: faker.helpers.arrayElement(BODY_SITES),
      patientInstruction: `Instruction: ${faker.lorem.sentence()}`,
      notes: `Note: ${faker.lorem.sentence()}`,
      requestor: faker.helpers.arrayElement(KNOWN_USERNAMES),
    };
  }

  return data;
}

/** Creates a service request on the encounter through its Service Requests tab and returns the data it entered. */
export async function createServiceRequest(
  page: Page,
  facilityId: string,
  patientId: string,
  encounterId: string,
  allFields: boolean = false,
  overrides: ServiceRequestOverrides = {},
): Promise<ServiceRequestTestData> {
  return test.step(
    "encounter.servicerequest.create",
    () =>
      fillAndSubmitServiceRequest(
        page,
        facilityId,
        patientId,
        encounterId,
        allFields,
        overrides,
      ),
    { box: true },
  );
}

/** {@link createServiceRequest} with one options object. */
export async function createServiceRequestViaUi(
  page: Page,
  {
    facilityId,
    patientId,
    encounterId,
    allFields = false,
    ...overrides
  }: {
    facilityId: string;
    patientId: string;
    encounterId: string;
    allFields?: boolean;
  } & ServiceRequestOverrides,
): Promise<ServiceRequestTestData> {
  return createServiceRequest(
    page,
    facilityId,
    patientId,
    encounterId,
    allFields,
    overrides,
  );
}

async function fillAndSubmitServiceRequest(
  page: Page,
  facilityId: string,
  patientId: string,
  encounterId: string,
  allFields: boolean,
  overrides: ServiceRequestOverrides,
): Promise<ServiceRequestTestData> {
  const data = { ...generateServiceRequestTestData(allFields), ...overrides };

  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
  );

  await page
    .getByRole("link", { name: "Create Service Request", exact: true })
    .click();

  const block = questionBlock(page, "Service Request");
  await expect(block).toHaveCount(1);
  await block
    .getByRole("combobox")
    .filter({ hasText: "Select Activity Definition" })
    .click();
  const picker = page.getByRole("dialog").filter({
    has: page.getByPlaceholder("Search activity definitions", { exact: true }),
  });
  await expect(picker).toBeVisible();
  for (const category of data.navigateCategories) {
    await picker.getByRole("option", { name: category, exact: true }).click();
  }
  await picker
    .getByPlaceholder("Search activity definitions", { exact: true })
    .fill(data.activityDefinition);
  await picker
    .getByRole("option")
    .filter({
      has: page.getByText(data.activityDefinition, { exact: true }),
    })
    .click();

  const serviceRequestCard = block
    .locator('[data-slot="collapsible"]')
    .filter({ hasText: data.activityDefinition });
  await serviceRequestCard.waitFor({ state: "visible" });

  await serviceRequestCard.locator('[data-slot="collapsible-trigger"]').click();

  await serviceRequestCard
    .getByRole("radio", { name: /routine/i })
    .waitFor({ state: "visible" });

  await serviceRequestCard.getByRole("radio", { name: data.priority }).check();

  if (allFields) {
    const bodySiteSelector = serviceRequestCard
      .locator("label")
      .filter({ hasText: /^Body Site$/ })
      .locator("..")
      .getByRole("combobox");
    await bodySiteSelector.waitFor({ state: "visible" });

    await selectFromValueSet(page, bodySiteSelector, {
      search: data.bodySite!,
    });

    await serviceRequestCard
      .getByPlaceholder(/enter patient instruction/i)
      .fill(data.patientInstruction!);

    const requestorSelector = serviceRequestCard
      .locator("label")
      .filter({ hasText: /^Requester$/ })
      .locator("..")
      .getByRole("combobox");
    await requestorSelector.waitFor({ state: "visible" });

    await selectFromCommand(page, requestorSelector, {
      search: data.requestor!,
    });

    // Capture the selected requestor's display name after selection
    const selectedRequestorName = await requestorSelector
      .locator("p")
      .textContent();
    data.requestor = selectedRequestorName?.trim() || data.requestor!;

    await serviceRequestCard.getByPlaceholder(/add note/i).fill(data.notes!);
  }

  // Service requests are authored on the v2 fill page — its primary action
  // is "Save Changes" (see fill/FillHeader.tsx).
  await submitAndExpectSuccess(page);

  return data;
}

/**
 * Creates, through the API, a lab activity definition with an observation
 * definition of its own, both cloned from the seeded Urinalysis records (same
 * specimen, codes and report type). Tests that edit the definitions or depend
 * on their data type use it instead of the shared Urinalysis fixture.
 */
export async function createLabActivityDefinitionViaApi({
  facilityId,
  observation = {},
}: {
  facilityId: string;
  /** Overrides for the cloned observation definition. */
  observation?: Partial<ObservationDefinitionCreate>;
}): Promise<{ activityTitle: string; observationTitle: string }> {
  const headers = adminApiHeaders();
  const api = apiBaseUrl();
  const facilityApi = `${api}/api/v1/facility/${facilityId}`;
  const sourceResponse = await fetch(
    `${facilityApi}/activity_definition/f-${facilityId}-urinalysis/`,
    { headers },
  );
  if (!sourceResponse.ok) {
    throw new Error(
      `Failed to read the Urinalysis activity definition: ${sourceResponse.status} — ${await sourceResponse.text()}`,
    );
  }
  const source = (await sourceResponse.json()) as ActivityDefinitionReadSpec;
  const [template] = source.observation_result_requirements;
  const suffix = faker.string.alphanumeric(8);

  const definitionResponse = await fetch(
    `${api}/api/v1/observation_definition/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `${template.title} ${suffix}`,
        slug_value: `e2e-observation-${suffix}`,
        facility: facilityId,
        status: "active",
        description: template.description,
        category: template.category,
        code: template.code,
        permitted_data_type: template.permitted_data_type,
        permitted_unit: template.permitted_unit ?? null,
        qualified_ranges: [],
        component: [],
        ...observation,
      }),
    },
  );
  if (!definitionResponse.ok) {
    throw new Error(
      `Failed to create observation definition: ${definitionResponse.status} — ${await definitionResponse.text()}`,
    );
  }
  const definition =
    (await definitionResponse.json()) as ObservationDefinitionRead;

  const activityTitle = `${source.title} ${suffix}`;
  const activityResponse = await fetch(`${facilityApi}/activity_definition/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: activityTitle,
      slug_value: `e2e-activity-${suffix}`,
      facility: facilityId,
      status: "active",
      classification: source.classification,
      kind: source.kind,
      code: source.code,
      description: source.description,
      usage: source.usage,
      category: source.category.slug,
      diagnostic_report_codes: source.diagnostic_report_codes,
      observation_result_requirements: [definition.slug],
      specimen_requirements: source.specimen_requirements.map(
        (specimen) => specimen.slug,
      ),
      charge_item_definitions: [],
      locations: source.locations.map((location) => location.id),
      healthcare_service: null,
      body_site: null,
      derived_from_uri: null,
    }),
  });
  if (!activityResponse.ok) {
    throw new Error(
      `Failed to create activity definition: ${activityResponse.status} — ${await activityResponse.text()}`,
    );
  }
  return { activityTitle, observationTitle: definition.title };
}

/** From the encounter page, opens the details of its service request for an activity. */
export async function openServiceRequestDetails(
  page: Page,
  activityDefinition: string,
): Promise<void> {
  await clickTabOrMenuItem(page, /service requests/i);
  await expect(page).toHaveURL(/\/service_requests$/);
  await page
    .locator('[data-slot="table-body"] [data-slot="table-row"]')
    .filter({ hasText: activityDefinition })
    .first()
    .getByRole("button", { name: "See Details" })
    .click();
  await page.waitForLoadState("networkidle");
}

/** Collects the specimen of the open service request (sample value 2, with notes). */
export async function collectSpecimenViaUi(page: Page): Promise<void> {
  await test.step(
    "encounter.specimen.collect",
    async () => {
      await page.getByRole("button", { name: "Collect Specimen" }).click();
      await expect(
        page.getByText("QR code generated successfully"),
      ).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expect(page.getByText("Sample Identification")).toBeVisible();
      await page.getByPlaceholder("Value", { exact: true }).fill("2");
      await expect(page.getByPlaceholder("Value", { exact: true })).toHaveValue(
        "2",
      );
      await page
        .getByRole("textbox", { name: "Type your Notes" })
        .fill("Test Notes");
      const collectButton = page.getByRole("button", {
        name: "Mark as collected",
        exact: true,
      });
      await expect(collectButton).toBeEnabled();
      const specimenResponse = page.waitForResponse(
        (resp) =>
          resp.url().includes("/specimen/") &&
          resp.request().method() === "PUT" &&
          resp.status() === 200,
      );
      const specimenCollectedToast = expectToast(page, /specimen collected/i);
      await Promise.all([
        collectButton.click(),
        specimenResponse,
        specimenCollectedToast,
      ]);
    },
    { box: true },
  );
}

/** Creates a diagnostic report of the first offered report type on the open service request. */
export async function createDiagnosticReportViaUi(
  page: Page,
): Promise<{ diagnosticReportId: string }> {
  return test.step(
    "encounter.diagnosticreport.create",
    async () => {
      await selectComboboxOption(reportTypeCombobox(page));
      const created = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().endsWith("/diagnostic_report/"),
      );
      await page.getByRole("button", { name: "Create Report" }).click();
      const response = await created;
      expect(response.ok()).toBe(true);
      return {
        diagnosticReportId: ((await response.json()) as { id: string }).id,
      };
    },
    { box: true },
  );
}

/** Types a value into the first result field of the open diagnostic report. */
export async function fillDiagnosticResultValue(
  page: Page,
  value: string,
): Promise<void> {
  const resultInput = page.getByPlaceholder("Result value").first();
  await resultInput.scrollIntoViewIfNeeded();
  await resultInput.fill(value);
  await expect(resultInput).toHaveValue(value);
}

/** Saves the results entered in the open diagnostic report. */
export async function saveDiagnosticResults(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Save Results" }).click();
  await expect(page.getByText("Test results saved successfully")).toBeVisible();
}

/** Enters a result value in the open diagnostic report and saves it. */
export async function enterDiagnosticResultsViaUi(
  page: Page,
  { value = "5" }: { value?: string } = {},
): Promise<void> {
  await test.step(
    "encounter.diagnosticreport.result.enter",
    async () => {
      await fillDiagnosticResultValue(page, value);
      await saveDiagnosticResults(page);
    },
    { box: true },
  );
}
