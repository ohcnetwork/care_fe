import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  expectEscapeRestoresFocus,
  openOverlayFromMenu,
} from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

function createObservation(status: "final" | "entered_in_error") {
  return {
    id: faker.string.uuid(),
    status,
    value_type: "decimal",
    value: { value: faker.number.int({ min: 10, max: 99 }).toString() },
    component: [],
    effective_datetime: new Date().toISOString(),
    observation_definition: {
      id: faker.string.uuid(),
      title: faker.word.words(3),
      status: "active",
      description: "",
      category: "laboratory",
      code: { system: "test", code: "glucose", display: "Glucose" },
      permitted_data_type: "decimal",
      component: [],
      body_site: null,
      method: null,
      permitted_unit: null,
      qualified_ranges: [],
    },
  };
}

function createReport() {
  const user = {
    username: "reviewer",
    first_name: "Review",
    last_name: "Clinician",
    profile_picture_url: null,
  };
  return {
    id: faker.string.uuid(),
    status: "final",
    code: { system: "test", code: "panel", display: faker.word.words(3) },
    category: { system: "test", code: "lab", display: "Laboratory" },
    conclusion: "",
    note: "",
    observations: [
      createObservation("final"),
      createObservation("entered_in_error"),
    ],
    created_by: user,
    updated_by: user,
    encounter: {
      id: getEncounterId(),
      facility: { id: getFacilityId() },
      patient: {
        id: getPatientId(),
        name: faker.person.fullName(),
        gender: "male",
        date_of_birth: "1990-01-01",
        instance_identifiers: [],
      },
    },
    service_request: { id: faker.string.uuid(), title: faker.word.words(3) },
    created_date: new Date().toISOString(),
    modified_date: new Date().toISOString(),
  };
}

const PAGES = [
  {
    name: "report page",
    url: (reportId: string) =>
      `/facility/${getFacilityId()}/patient/${getPatientId()}/diagnostic_reports/${reportId}`,
  },
  {
    name: "encounter reports tab",
    url: () =>
      `/facility/${getFacilityId()}/patient/${getPatientId()}/encounter/${getEncounterId()}/diagnostic_reports`,
  },
];

test.describe("Diagnostic report observation history", () => {
  for (const { name, url } of PAGES) {
    test(`opens from the test results menu on the ${name}`, async ({
      page,
    }) => {
      const report = createReport();
      const [current, removed] = report.observations;
      const reportsUrl = `**/api/v1/patient/${getPatientId()}/diagnostic_report/`;
      await page.route(`${reportsUrl}?*`, (route) =>
        route.fulfill({ json: { count: 1, results: [report] } }),
      );
      await page.route(`${reportsUrl}${report.id}/`, (route) =>
        route.fulfill({ json: report }),
      );
      await page.route("**/api/v1/files/?*", (route) =>
        route.fulfill({ json: { count: 0, results: [] } }),
      );

      await page.goto(url(report.id));
      const actions = page.getByRole("button", {
        name: "Test Results actions",
        exact: true,
      });
      const history = page.getByRole("dialog", {
        name: "Observation History",
        exact: true,
      });
      await openOverlayFromMenu(
        page,
        actions,
        "View Observation History",
        history,
      );
      await expect(
        history.getByRole("heading", {
          name: removed.observation_definition.title,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        history.getByText(current.observation_definition.title),
      ).toHaveCount(0);
      await expectEscapeRestoresFocus(page, history, actions);
    });
  }
});
