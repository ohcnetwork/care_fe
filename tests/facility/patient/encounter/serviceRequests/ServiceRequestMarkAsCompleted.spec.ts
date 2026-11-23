import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { clickTabOrMenuItem, expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import { createServiceRequest } from "./serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

/**
 * Serves a service request (and what its page loads) from mocks, so a test can
 * pick a status or a report state that is slow to reach through the UI. A
 * PATCH is answered with its own body, and the next read returns its status.
 */
async function mockServiceRequest(
  page: Page,
  {
    status,
    reportStatus,
  }: { status: string; reportStatus?: "preliminary" | "final" },
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
    diagnostic_report_codes: [code],
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
    conclusion: "",
    note: "",
    observations: [],
    created_by: user,
    updated_by: user,
    encounter,
    service_request: { id: serviceRequestId, title: activity.title },
    created_date: "2026-09-19T10:00:01Z",
    modified_date: "2026-09-19T10:00:45Z",
  };
  let currentStatus = status;

  const serviceRequestUrl = `**/api/v1/facility/${facilityId}/service_request/${serviceRequestId}/`;
  await page.route(serviceRequestUrl, (route) => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON();
      currentStatus = body.status;
      return route.fulfill({ json: body });
    }
    return route.fulfill({
      json: {
        id: serviceRequestId,
        title: activity.title,
        category: "laboratory",
        status: currentStatus,
        intent: "order",
        priority: "routine",
        activity_definition: activity,
        encounter,
        diagnostic_reports: reportStatus ? [report] : [],
        specimens: [],
        locations: [],
        tags: [],
      },
    });
  });
  await page.route(
    `**/api/v1/patient/${patientId}/diagnostic_report/${report.id}/`,
    (route) => route.fulfill({ json: report }),
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
    title: activity.title,
  };
}

function requestSection(page: Page, title: string) {
  return page.getByRole("region", { name: title, exact: true });
}

function waitForCompletion(page: Page) {
  return page.waitForRequest(
    (request) =>
      request.method() === "PATCH" &&
      /\/service_request\/[^/]+\/$/.test(new URL(request.url()).pathname),
  );
}

async function openMarkAsCompletedDialog(page: Page) {
  await page.getByRole("button", { name: "More Actions" }).click();
  await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
  const dialog = page.getByRole("dialog", { name: "Add Completion Note" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("Mark a service request as completed from the actions menu", () => {
  test("completes a request that has no report, with a completion note", async ({
    page,
  }) => {
    const facilityId = getFacilityId();
    const { patientId, encounterId } =
      await createQuestionnaireEncounter(facilityId);
    const { activityDefinition } = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
      false,
      { activityDefinition: "Urinalysis" },
    );
    const note = faker.lorem.sentence();

    await test.step("Open the new request", async () => {
      await clickTabOrMenuItem(page, /service requests/i);
      await page
        .locator('[data-slot="table-body"] [data-slot="table-row"]')
        .filter({ hasText: activityDefinition })
        .first()
        .getByRole("button", { name: "See Details" })
        .click();
      await expect(
        requestSection(page, activityDefinition).getByText("Active", {
          exact: true,
        }),
      ).toBeVisible();
    });

    await test.step("Complete it from the actions menu", async () => {
      const dialog = await openMarkAsCompletedDialog(page);
      await dialog
        .getByRole("textbox", { name: "Completion Note", exact: true })
        .fill(note);
      const completion = waitForCompletion(page);
      await dialog.getByRole("button", { name: "Save & Complete" }).click();
      expect((await completion).postDataJSON()).toMatchObject({
        status: "completed",
        note,
      });
    });

    await test.step("The request shows as completed", async () => {
      await expectToast(page, "Service request marked as completed");
      await expect(
        requestSection(page, activityDefinition).getByText("Completed", {
          exact: true,
        }),
      ).toBeVisible();
      // A completed request has no actions left in the menu
      await expect(
        page.getByRole("button", { name: "More Actions" }),
      ).toBeHidden();
    });
  });

  test("completes a request while its report is still preliminary", async ({
    page,
  }) => {
    const fixture = await mockServiceRequest(page, {
      status: "active",
      reportStatus: "preliminary",
    });
    await page.goto(fixture.url);
    await expect(
      requestSection(page, fixture.title).getByText("Active", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "More Actions" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Mark as Completed" }),
    ).toBeEnabled();
    await page.keyboard.press("Escape");

    const dialog = await openMarkAsCompletedDialog(page);
    const completion = waitForCompletion(page);
    await dialog.getByRole("button", { name: "Save & Complete" }).click();
    expect((await completion).postDataJSON()).toMatchObject({
      status: "completed",
      note: null,
    });
    await expectToast(page, "Service request marked as completed");
    await expect(
      requestSection(page, fixture.title).getByText("Completed", {
        exact: true,
      }),
    ).toBeVisible();
  });

  for (const { status, label, offered } of [
    { status: "draft", label: "Draft", offered: true },
    { status: "on_hold", label: "On Hold", offered: false },
    { status: "entered_in_error", label: "Entered in Error", offered: false },
  ]) {
    test(`${offered ? "offers" : "does not offer"} Mark as Completed for a request that is ${label}`, async ({
      page,
    }) => {
      const fixture = await mockServiceRequest(page, { status });
      await page.goto(fixture.url);
      await expect(
        requestSection(page, fixture.title).getByText(label, { exact: true }),
      ).toBeVisible();

      await page.getByRole("button", { name: "More Actions" }).click();
      await expect(
        page.getByRole("menuitem", { name: "Mark as revoked" }),
      ).toBeVisible();
      const markAsCompleted = page.getByRole("menuitem", {
        name: "Mark as Completed",
      });
      if (offered) {
        await expect(markAsCompleted).toBeEnabled();
      } else {
        await expect(markAsCompleted).toBeHidden();
      }
    });
  }
});
