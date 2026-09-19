import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import type { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import type { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import type { ObservationRead } from "@/types/emr/observation/observation";
import type {
  ObservationDefinitionCreate,
  ObservationDefinitionRead,
  QuestionType,
} from "@/types/emr/observationDefinition/observationDefinition";

import { createServiceRequest } from "./serviceRequest";

test.use({
  storageState: "tests/.auth/user.json",
  viewport: { width: 1440, height: 1000 },
});

function getEntry(page: Page, reportType: string) {
  return page
    .locator('[data-slot="collapsible"]')
    .filter({
      has: page.locator('[data-slot="collapsible-trigger"]').filter({
        hasText: reportType,
      }),
    })
    .first();
}

function getObservationCard(
  page: Page,
  entry: Locator,
  definition: ObservationDefinitionRead,
) {
  return entry.locator('[data-slot="card"]').filter({
    has: page.getByText(definition.title, { exact: true }),
  });
}

async function createReport(page: Page, reportType: string) {
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select Diagnostic Report Type" })
    .click();
  await page.getByRole("option", { name: reportType }).click();
  const created = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().endsWith("/diagnostic_report/"),
  );
  await page
    .getByRole("button", { name: "Create Report", exact: true })
    .click();
  const response = await created;
  expect(response.ok()).toBe(true);
  await expect(
    getEntry(page, reportType).getByRole("button", {
      name: "Add observation",
      exact: true,
    }),
  ).toBeEnabled();
  return ((await response.json()) as DiagnosticReportRead).id;
}

async function addObservation(
  page: Page,
  entry: Locator,
  definition: ObservationDefinitionRead,
) {
  await entry
    .getByRole("button", { name: "Add observation", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Search observations", exact: true })
    .fill(definition.title);
  await page.getByRole("option", { name: definition.title }).click();
  await expect(
    page.getByRole("combobox", { name: "Search observations", exact: true }),
  ).toHaveCount(0);
  await expect(getObservationCard(page, entry, definition)).toBeVisible();
}

async function saveResults(page: Page, entry: Locator) {
  await entry
    .getByRole("button", { name: "Save Results", exact: true })
    .click();
  await expect(
    entry.getByRole("button", { name: "Save Results", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText("Test results saved successfully", { exact: true }).last(),
  ).toBeVisible();
}

test.describe("Additional diagnostic report observations", () => {
  let facilityId: string;
  let activityTitle: string;
  let reportTypes: string[];
  let apiOrigin: string;
  let headers: { Authorization: string };
  let numericDefinition: ObservationDefinitionRead;
  let textDefinition: ObservationDefinitionRead;
  let componentDefinition: ObservationDefinitionRead;

  test.beforeAll(async ({ browser }) => {
    facilityId = getFacilityId();
    const page = await browser.newPage({
      storageState: "tests/.auth/user.json",
    });
    try {
      const facilityResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith(`/api/v1/facility/${facilityId}/`) &&
          response.status() === 200,
      );
      await page.goto(`/facility/${facilityId}/settings/activity_definitions`);
      const response = await facilityResponse;
      apiOrigin = new URL(response.url()).origin;
      headers = {
        Authorization: (await response.request().allHeaders()).authorization,
      };
      const activities: ActivityDefinitionReadSpec[] = [];
      for (const slug of ["fasting-blood-glucose", "urinalysis"]) {
        const activityResponse = await page.request.get(
          `${apiOrigin}/api/v1/facility/${facilityId}/activity_definition/f-${facilityId}-${slug}/`,
          { headers },
        );
        await expect(activityResponse).toBeOK();
        activities.push(await activityResponse.json());
      }

      // Reuse seeded terminology to keep the test independent of external
      // terminology services. All definitions and the activity are new records.
      const activity = activities[0];
      const template = activity.observation_result_requirements[0];
      const unit = template.permitted_unit ?? {
        system: "http://unitsofmeasure.org",
        code: "mg/dL",
        display: "mg/dL",
      };
      const suffix = faker.string.alphanumeric(8);
      const createDefinition = async (
        title: string,
        overrides: Partial<ObservationDefinitionCreate>,
      ) => {
        const created = await page.request.post(
          `${apiOrigin}/api/v1/observation_definition/`,
          {
            headers,
            data: {
              title: `${title} ${suffix}`,
              slug_value: `extra-${faker.string.alphanumeric(8)}`,
              facility: facilityId,
              status: "active",
              description: "Additional report observation regression test",
              category: "laboratory",
              code: template.code,
              permitted_data_type: "decimal",
              permitted_unit: unit,
              qualified_ranges: [],
              component: [],
              ...overrides,
            },
          },
        );
        await expect(created).toBeOK();
        return (await created.json()) as ObservationDefinitionRead;
      };
      numericDefinition = await createDefinition("Additional glucose", {});
      textDefinition = await createDefinition("Culture comment", {
        permitted_data_type: "string" as QuestionType,
        permitted_unit: null,
      });
      componentDefinition = await createDefinition("Additional panel", {
        permitted_unit: null,
        component: [
          {
            code: template.code,
            permitted_data_type: "decimal" as QuestionType,
            permitted_unit: unit,
            qualified_ranges: [],
          },
        ],
      });

      activityTitle = `Additional report observations ${suffix}`;
      const reportCodes = activities.flatMap(
        (definition) => definition.diagnostic_report_codes,
      );
      reportTypes = reportCodes.map((code) => code.display);
      const created = await page.request.post(
        `${apiOrigin}/api/v1/facility/${facilityId}/activity_definition/`,
        {
          headers,
          data: {
            title: activityTitle,
            slug_value: `extra-reports-${suffix}`,
            facility: facilityId,
            status: "active",
            classification: "laboratory",
            kind: "service_request",
            code: activity.code,
            description: "Additional report observation regression test",
            usage: "Additional report observation regression test",
            category: activity.category.slug,
            diagnostic_report_codes: reportCodes,
            observation_result_requirements: [],
            specimen_requirements: [],
            charge_item_definitions: [],
            locations: [],
            healthcare_service: null,
            body_site: null,
            derived_from_uri: null,
          },
        },
      );
      await expect(created).toBeOK();
    } finally {
      await page.close();
    }
  });

  test("saves independent extra observations and repeats them after reopening legacy report responses", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    const patientId = getPatientId();
    const [firstReportType, secondReportType] = reportTypes;
    const firstEntry = getEntry(page, firstReportType);
    const secondEntry = getEntry(page, secondReportType);
    const numericCard = getObservationCard(page, firstEntry, numericDefinition);
    const textCard = getObservationCard(page, firstEntry, textDefinition);
    const componentCard = getObservationCard(
      page,
      secondEntry,
      componentDefinition,
    );
    let firstReportId: string;
    let secondReportId: string;

    // Older backends omit the definition slug in report details. Keep covering
    // the compatibility path even after the backend starts returning it.
    await page.route(
      `**/api/v1/patient/${patientId}/diagnostic_report/*/`,
      async (route) => {
        if (route.request().method() !== "GET") {
          await route.continue();
          return;
        }
        const response = await route.fetch();
        const report: DiagnosticReportRead = await response.json();
        for (const observation of report.observations) {
          if (observation.observation_definition) {
            const { slug: _slug, ...definition } =
              observation.observation_definition;
            Object.assign(observation, { observation_definition: definition });
          }
        }
        await route.fulfill({ response, json: report });
      },
    );

    const readObservations = async (reportId: string) => {
      const response = await page.request.get(
        `${apiOrigin}/api/v1/patient/${patientId}/diagnostic_report/${reportId}/`,
        { headers },
      );
      await expect(response).toBeOK();
      return ((await response.json()) as DiagnosticReportRead).observations;
    };
    const resultsFor = (
      observations: ObservationRead[],
      definition: ObservationDefinitionRead,
    ) =>
      observations.filter(
        (observation) =>
          observation.observation_definition?.id === definition.id,
      );

    await test.step("Create reports with no shared observation requirements", async () => {
      await createServiceRequest(
        page,
        facilityId,
        patientId,
        getEncounterId(),
        false,
        { activityDefinition: activityTitle },
      );
      await clickTabOrMenuItem(page, /service requests/i);
      await page
        .getByRole("row")
        .filter({ hasText: activityTitle })
        .getByRole("button", { name: "See Details" })
        .click();
      firstReportId = await createReport(page, firstReportType);
      await page
        .getByRole("button", { name: "Another Diagnostic Report" })
        .click();
      secondReportId = await createReport(page, secondReportType);
      const serviceRequestUrlPath = testInfo.outputPath(
        "service-request-url.txt",
      );
      await writeFile(serviceRequestUrlPath, page.url());
      await testInfo.attach("service-request-url", {
        path: serviceRequestUrlPath,
        contentType: "text/plain",
      });
    });

    await test.step("Search facility definitions and add independent report content", async () => {
      const addObservationButton = firstEntry.getByRole("button", {
        name: "Add observation",
        exact: true,
      });
      await addObservationButton.focus();
      await addObservationButton.press("Enter");
      const search = page.getByRole("combobox", {
        name: "Search observations",
        exact: true,
      });
      await search.fill(numericDefinition.title);
      await expect(
        page.getByRole("option", { name: numericDefinition.title }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("extra-observations-picker.png"),
      });
      await page.getByRole("option", { name: numericDefinition.title }).click();
      await expect(search).toHaveCount(0);
      await numericCard.getByPlaceholder("Result value").fill("108.5");
      await addObservation(page, firstEntry, textDefinition);
      await textCard
        .getByPlaceholder("Result value")
        .fill("No growth detected");
      await expect(secondEntry.getByText(numericDefinition.title)).toHaveCount(
        0,
      );
      await expect(secondEntry.getByText(textDefinition.title)).toHaveCount(0);

      await addObservation(page, secondEntry, componentDefinition);
      await componentCard.getByPlaceholder("Component value").fill("96.5");
      await expect(firstEntry.getByText(componentDefinition.title)).toHaveCount(
        0,
      );
      await page.screenshot({
        path: testInfo.outputPath("extra-observations-reports.png"),
        fullPage: true,
      });
    });

    await test.step("Saving one report preserves the other's added draft", async () => {
      await saveResults(page, firstEntry);
      await expect(
        componentCard.getByPlaceholder("Component value"),
      ).toHaveValue("96.5");
      await saveResults(page, secondEntry);
      const firstResults = await readObservations(firstReportId);
      expect(firstResults).toHaveLength(2);
      expect(resultsFor(firstResults, numericDefinition)[0]).toMatchObject({
        value_type: "decimal",
        value: { value: "108.5", unit: numericDefinition.permitted_unit },
      });
      expect(resultsFor(firstResults, textDefinition)[0]).toMatchObject({
        value_type: "string",
        value: { value: "No growth detected" },
      });
      const secondResults = await readObservations(secondReportId);
      expect(secondResults).toHaveLength(1);
      expect(resultsFor(secondResults, componentDefinition)[0]).toMatchObject({
        component: [
          {
            code: componentDefinition.component![0].code,
            value: {
              value: "96.5",
              unit: componentDefinition.component![0].permitted_unit,
            },
          },
        ],
      });
    });

    await test.step("Reload and repeat added results with their original data types and units", async () => {
      await page.reload();
      await expect(numericCard.getByPlaceholder("Result value")).toHaveValue(
        "108.5",
      );
      await expect(textCard.getByPlaceholder("Result value")).toHaveValue(
        "No growth detected",
      );
      await expect(
        componentCard.getByPlaceholder("Component value"),
      ).toHaveValue("96.5");

      await page.screenshot({
        path: testInfo.outputPath("extra-observations-saved.png"),
        fullPage: true,
      });

      await numericCard
        .getByRole("button", { name: "Add another result" })
        .click();
      await numericCard.getByPlaceholder("Result value").nth(1).fill("112.25");
      await textCard
        .getByRole("button", { name: "Add another result" })
        .click();
      await textCard
        .getByPlaceholder("Result value")
        .nth(1)
        .fill("Reviewed sample");
      await componentCard
        .getByRole("button", { name: "Add another result" })
        .click();
      await componentCard
        .getByPlaceholder("Component value")
        .nth(1)
        .fill("101.25");
      await saveResults(page, firstEntry);
      await expect(
        componentCard.getByPlaceholder("Component value").nth(1),
      ).toHaveValue("101.25");
      await saveResults(page, secondEntry);

      const firstResults = await readObservations(firstReportId);
      expect(firstResults).toHaveLength(4);
      expect(resultsFor(firstResults, numericDefinition)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value_type: "decimal",
            value: { value: "112.25", unit: numericDefinition.permitted_unit },
          }),
        ]),
      );
      expect(resultsFor(firstResults, textDefinition)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value_type: "string",
            value: expect.objectContaining({ value: "Reviewed sample" }),
          }),
        ]),
      );
      const secondResults = await readObservations(secondReportId);
      expect(secondResults).toHaveLength(2);
      expect(resultsFor(secondResults, componentDefinition)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            component: [
              expect.objectContaining({
                code: componentDefinition.component![0].code,
                value: {
                  value: "101.25",
                  unit: componentDefinition.component![0].permitted_unit,
                },
              }),
            ],
          }),
        ]),
      );
    });

    await test.step("Correct a saved extra observation without changing another report", async () => {
      await page.reload();
      await expect(textCard.getByPlaceholder("Result value")).toHaveCount(2);
      await textCard
        .getByRole("button", { name: "Remove observation", exact: true })
        .first()
        .click();
      await saveResults(page, firstEntry);
      const corrected = resultsFor(
        await readObservations(firstReportId),
        textDefinition,
      );
      expect(corrected).toHaveLength(2);
      expect(
        corrected.filter((result) => result.status === "entered_in_error"),
      ).toHaveLength(1);
      expect(await readObservations(secondReportId)).toHaveLength(2);
      await page.reload();
      await expect(textCard.getByPlaceholder("Result value")).toHaveCount(1);
      await expect(
        firstEntry.getByRole("button", { name: /observation history/i }),
      ).toBeVisible();
    });

    await test.step("Keep correction history when the last extra definition is removed", async () => {
      await componentCard
        .getByRole("button", { name: "Remove observation", exact: true })
        .first()
        .click();
      await componentCard
        .getByRole("button", { name: "Remove observation", exact: true })
        .click();
      await saveResults(page, secondEntry);
      await page.reload();
      await expect(componentCard).toHaveCount(0);
      await expect(
        secondEntry.getByRole("button", { name: /observation history/i }),
      ).toBeVisible();
      expect(await readObservations(secondReportId)).toEqual([
        expect.objectContaining({ status: "entered_in_error" }),
        expect.objectContaining({ status: "entered_in_error" }),
      ]);
    });
  });
});
