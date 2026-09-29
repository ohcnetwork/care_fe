import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

interface ReportWorkflowOptions {
  hasReportCode?: boolean;
  hasExistingReport?: boolean;
  reportStatus?: "preliminary" | "final";
}

async function mockReportWorkflow(
  page: Page,
  {
    hasReportCode = false,
    hasExistingReport = false,
    reportStatus = "preliminary",
  }: ReportWorkflowOptions = {},
) {
  const facilityId = getFacilityId();
  const patientId = getPatientId();
  const serviceRequestId = faker.string.uuid();
  const code = {
    system: "test",
    code: faker.string.alphanumeric(8),
    display: faker.word.words(3),
  };
  const activity = {
    id: faker.string.uuid(),
    slug: faker.string.uuid(),
    title: faker.word.words(3),
    classification: "laboratory",
    diagnostic_report_codes: hasReportCode ? [code] : [],
    specimen_requirements: [],
    observation_result_requirements: [],
  };
  const encounter = {
    id: getEncounterId(),
    patient: {
      id: patientId,
      name: faker.person.fullName(),
      gender: "male",
      date_of_birth: "1990-01-01",
      instance_identifiers: [],
    },
  };
  const user = {
    username: "reviewer",
    first_name: "Review",
    last_name: "Clinician",
    profile_picture_url: null,
  };
  const report = {
    id: faker.string.uuid(),
    status: reportStatus,
    code,
    category: { system: "test", code: "lab", display: "Laboratory" },
    conclusion: faker.lorem.sentence(),
    note: "",
    observations: [],
    created_by: user,
    updated_by: user,
    encounter,
    service_request: { id: serviceRequestId, title: activity.title },
    created_date: "2026-09-19T10:00:01Z",
    modified_date: "2026-09-19T10:00:45Z",
  };
  const reports = hasExistingReport ? [report] : [];
  const reportCollectionUrl = `**/api/v1/patient/${patientId}/diagnostic_report/`;

  await page.route(reportCollectionUrl, (route) => {
    reports.push(report);
    return route.fulfill({ status: 201, json: report });
  });
  await page.route(`${reportCollectionUrl}${report.id}/`, (route) =>
    route.fulfill({ json: report }),
  );
  await page.route(
    `**/api/v1/facility/${facilityId}/service_request/${serviceRequestId}/`,
    (route) =>
      route.fulfill({
        json: {
          id: serviceRequestId,
          title: activity.title,
          category: "laboratory",
          status: "active",
          intent: "order",
          priority: "routine",
          activity_definition: activity,
          encounter,
          diagnostic_reports: reports,
          specimens: [],
          locations: [],
          tags: [],
        },
      }),
  );
  await page.route(
    `**/api/v1/facility/${facilityId}/activity_definition/${activity.slug}/`,
    (route) => route.fulfill({ json: activity }),
  );
  for (const resource of ["charge_item", "account"]) {
    await page.route(
      `**/api/v1/facility/${facilityId}/${resource}/?*`,
      (route) => route.fulfill({ json: { count: 0, results: [] } }),
    );
  }
  await page.route("**/api/v1/files/?*", (route) =>
    route.fulfill({ json: { count: 0, results: [] } }),
  );

  return {
    url: `/facility/${facilityId}/service_requests/${serviceRequestId}`,
    activity,
    report,
    reportCollectionUrl,
  };
}

test.describe("Service request report workflow", () => {
  test("hides report entry for a template without observations, report codes, or existing reports", async ({
    page,
  }) => {
    const fixture = await mockReportWorkflow(page);
    await page.goto(fixture.url);
    await expect(
      page.getByRole("heading", { name: fixture.activity.title, exact: true }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Test Results Entry", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Create Report", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Save Results", exact: true }),
    ).toHaveCount(0);
  });

  test("allows report creation for a code-only template", async ({ page }) => {
    const fixture = await mockReportWorkflow(page, { hasReportCode: true });
    await page.goto(fixture.url);
    await expect(
      page.getByRole("button", { name: "Test Results Entry", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Diagnostic Report Type" })
      .click();
    await page
      .getByRole("option", {
        name: `${fixture.report.code.display} (${fixture.report.code.code})`,
        exact: true,
      })
      .click();

    const created = page.waitForRequest(fixture.reportCollectionUrl);
    await page
      .getByRole("button", { name: "Create Report", exact: true })
      .click();
    expect((await created).postDataJSON()).toMatchObject({
      code: fixture.report.code,
      service_request: fixture.report.service_request.id,
      status: "preliminary",
    });
    await expect(
      page.getByRole("button", { name: "Save Results", exact: true }),
    ).toBeVisible();
  });

  test("keeps an existing report editable after its template requirements are removed", async ({
    page,
  }) => {
    const fixture = await mockReportWorkflow(page, { hasExistingReport: true });
    await page.goto(fixture.url);
    await expect(
      page.getByRole("button", { name: "Save Results", exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByRole("textbox", { name: "Conclusion", exact: true }),
    ).toHaveText(fixture.report.conclusion);
    await expect(
      page.getByRole("button", { name: "Create Report", exact: true }),
    ).toHaveCount(0);
  });

  test("shows updates within the creation minute in collapsed and expanded report headers", async ({
    page,
  }) => {
    const fixture = await mockReportWorkflow(page, {
      hasExistingReport: true,
      reportStatus: "final",
    });
    await page.goto(fixture.url);
    const expand = page.getByRole("button", {
      name: `Expand ${fixture.report.code.display}`,
      exact: true,
    });
    await expect(expand).toContainText("Updated:");
    await expect(expand.locator("time")).toHaveAttribute(
      "datetime",
      fixture.report.modified_date,
    );
    await expand.click();

    const collapse = page.getByRole("button", {
      name: `Collapse ${fixture.report.code.display}`,
      exact: true,
    });
    await expect(collapse).toContainText("Created:");
    await expect(collapse).toContainText("Last Updated:");
    await expect(collapse.locator("time")).toHaveCount(2);
    await expect(collapse.locator("time").first()).toHaveAttribute(
      "datetime",
      fixture.report.created_date,
    );
    await expect(collapse.locator("time").last()).toHaveAttribute(
      "datetime",
      fixture.report.modified_date,
    );
  });
});
