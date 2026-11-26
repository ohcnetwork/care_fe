import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import {
  expectEscapeRestoresFocus,
  openOverlayFromMenu,
} from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import { reportTypeCombobox } from "./serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

interface ReportWorkflowOptions {
  hasReportCode?: boolean;
  hasExistingReport?: boolean;
  reportStatus?: "preliminary" | "final";
  specimenScenario?:
    "fractional-template" | "draft-without-quantity" | "collected";
}

async function mockReportWorkflow(
  page: Page,
  {
    hasReportCode = false,
    hasExistingReport = false,
    reportStatus = "preliminary",
    specimenScenario,
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
  const specimenDefinition = {
    id: faker.string.uuid(),
    slug: faker.string.uuid(),
    title: faker.word.words(3),
    type_collected: code,
    collection: {
      quantity: {
        value: specimenScenario === "fractional-template" ? "0.5" : "4",
        unit: code,
      },
    },
  };
  const draft = {
    id: faker.string.uuid(),
    status: "draft",
    accession_identifier: faker.string.uuid(),
    specimen_definition: specimenDefinition,
    specimen_type: code,
    collection: { quantity: null },
  };
  const collected = {
    ...draft,
    id: faker.string.uuid(),
    status: "available",
    processing: [],
  };
  const discarded = {
    ...collected,
    id: faker.string.uuid(),
    status: "unavailable",
    note: faker.lorem.sentence(),
  };
  const specimens = {
    "fractional-template": [],
    "draft-without-quantity": [draft],
    collected: [collected, discarded],
  };
  const activity = {
    id: faker.string.uuid(),
    slug: faker.string.uuid(),
    title: faker.word.words(3),
    classification: "laboratory",
    diagnostic_report_codes: hasReportCode ? [code] : [],
    specimen_requirements: specimenScenario ? [specimenDefinition] : [],
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
          specimens: specimenScenario ? specimens[specimenScenario] : [],
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
    createDraftUrl: `**/service_request/${serviceRequestId}/create_specimen_from_definition/`,
    updateSpecimenUrl: `**/specimen/${draft.id}/`,
    discarded,
    discardSpecimenUrl: `**/specimen/${collected.id}/`,
  };
}

test.describe("Service request report workflow", () => {
  test("does not copy a fractional template quantity into the draft", async ({
    page,
  }) => {
    const fixture = await mockReportWorkflow(page, {
      specimenScenario: "fractional-template",
    });
    await page.route(fixture.createDraftUrl, (route) =>
      route.fulfill({ status: 201, json: {} }),
    );
    await page.goto(fixture.url);
    const created = page.waitForRequest(fixture.createDraftUrl);
    await page.getByRole("button", { name: "Collect Specimen" }).click();
    const { specimen } = (await created).postDataJSON();
    expect(specimen.collection.quantity).toBeNull();
    await expect(page.getByPlaceholder("Value", { exact: true })).toHaveValue(
      "0.5",
    );
  });

  test("sends null when a collector clears the optional quantity", async ({
    page,
  }) => {
    const fixture = await mockReportWorkflow(page, {
      specimenScenario: "draft-without-quantity",
    });
    await page.route(fixture.updateSpecimenUrl, (route) =>
      route.fulfill({ json: {} }),
    );
    await page.goto(fixture.url);
    await page.getByRole("button", { name: "Collect Specimen" }).click();
    const value = page.getByPlaceholder("Value", { exact: true });
    // Reopening the draft must not reapply the definition's quantity.
    await expect(value).toHaveValue("");
    await value.fill("2");
    await value.fill("");
    const updated = page.waitForRequest(fixture.updateSpecimenUrl);
    await page.getByRole("button", { name: "Mark as collected" }).click();
    expect((await updated).postDataJSON().collection.quantity).toBeNull();
  });

  test("shows discarded specimens in the history sheet opened from the menu", async ({
    page,
  }) => {
    const fixture = await mockReportWorkflow(page, {
      specimenScenario: "collected",
    });
    await page.goto(fixture.url);
    const history = page.getByRole("button", {
      name: "View Specimen History",
      exact: true,
    });
    const sheet = page.getByRole("dialog", {
      name: "Specimen History",
      exact: true,
    });
    await openOverlayFromMenu(page, history, "View Specimen History", sheet);
    await expect(sheet.getByText("Unavailable", { exact: true })).toBeVisible();
    await expect(sheet.getByText(fixture.discarded.note)).toBeVisible();
    await expectEscapeRestoresFocus(page, sheet, history);
  });

  test("discards a collected specimen with the reason chosen in the confirmation", async ({
    page,
  }) => {
    const fixture = await mockReportWorkflow(page, {
      specimenScenario: "collected",
    });
    await page.route(fixture.discardSpecimenUrl, (route) =>
      route.fulfill({ json: {} }),
    );
    await page.goto(fixture.url);
    const actions = page.getByRole("button", { name: "Actions", exact: true });
    const confirmation = page.getByRole("alertdialog", {
      name: "Are you sure?",
      exact: true,
    });

    await test.step("Dismiss the confirmation after choosing a reason", async () => {
      await openOverlayFromMenu(page, actions, "Discard", confirmation);
      await confirmation
        .getByRole("radio", { name: /^Unsatisfactory/ })
        .click();
      await expectEscapeRestoresFocus(page, confirmation, actions);
    });

    await test.step("Discard with a reason", async () => {
      await openOverlayFromMenu(page, actions, "Discard", confirmation);
      const discard = confirmation.getByRole("button", {
        name: "Discard",
        exact: true,
      });
      // The dismissed reason must not carry over into the reopened dialog.
      await expect(
        confirmation.getByRole("radio", { checked: true }),
      ).toHaveCount(0);
      await expect(discard).toBeDisabled();
      await confirmation
        .getByRole("radio", { name: /^Unsatisfactory/ })
        .click();
      const updated = page.waitForRequest(fixture.discardSpecimenUrl);
      await discard.click();
      expect((await updated).postDataJSON().status).toBe("unsatisfactory");
      await expect(confirmation).toBeHidden();
    });
  });

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
    await reportTypeCombobox(page).click();
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

  test("shows updates within the creation minute in collapsed and expanded reports", async ({
    page,
  }) => {
    const fixture = await mockReportWorkflow(page, {
      hasExistingReport: true,
      reportStatus: "final",
    });
    await page.goto(fixture.url);
    const expand = page
      .locator("#service-request-section-review")
      .getByRole("button", {
        name: `Expand ${fixture.report.code.display}`,
        exact: true,
      });
    await expect(expand).toContainText("Updated:");
    await expect(expand.locator("time")).toHaveAttribute(
      "datetime",
      fixture.report.modified_date,
    );
    await expand.click();

    const review = page.locator("#service-request-section-review");
    await expect(
      review.getByRole("button", {
        name: `Collapse ${fixture.report.code.display}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(review.getByText(/^Created:/)).toBeVisible();
    await expect(review.getByText(/^Last Updated:/)).toBeVisible();
    await expect(review.locator("time")).toHaveCount(2);
    await expect(review.locator("time").first()).toHaveAttribute(
      "datetime",
      fixture.report.created_date,
    );
    await expect(review.locator("time").last()).toHaveAttribute(
      "datetime",
      fixture.report.modified_date,
    );
  });
});
