import { faker } from "@faker-js/faker";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { clickTabOrMenuItem } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";

import type { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";

import { createServiceRequest } from "./serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

function getReportCards(page: Page, reportType: string) {
  return page.locator('[data-slot="collapsible"]').filter({
    has: page.locator('[data-slot="collapsible-trigger"]').filter({
      hasText: reportType,
    }),
  });
}

async function createReport(page: Page, reportType: string) {
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select Diagnostic Report Type" })
    .click();
  await page.getByRole("option", { name: reportType }).click();
  await page
    .getByRole("button", { name: "Create Report", exact: true })
    .click();
  await expect(
    getReportCards(page, reportType).first().getByPlaceholder("Result value"),
  ).toBeVisible();
}

async function saveResults(page: Page, entry: Locator) {
  await entry.getByRole("button", { name: "Save Results" }).click();
  await expect(entry.getByPlaceholder("Result value")).not.toBeVisible();
  await expect(
    page.getByText("Test results saved successfully", { exact: true }).last(),
  ).toBeVisible();
}

test.describe("Multiple diagnostic reports", () => {
  let facilityId: string;
  let activityTitle: string;
  let reportTypes: string[];

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
      const apiOrigin = new URL(response.url()).origin;
      const headers = {
        Authorization: (await response.request().allHeaders()).authorization,
      };
      const activities: ActivityDefinitionReadSpec[] = [];

      // Reuse seeded clinical codes without depending on terminology search.
      // The activity created for this test is isolated from the shared fixtures.
      for (const slug of ["fasting-blood-glucose", "urinalysis"]) {
        const activityResponse = await page.request.get(
          `${apiOrigin}/api/v1/facility/${facilityId}/activity_definition/f-${facilityId}-${slug}/`,
          { headers },
        );
        await expect(activityResponse).toBeOK();
        activities.push(await activityResponse.json());
      }

      const activity = activities[0];
      const reportCodes = activities.flatMap(
        (definition) => definition.diagnostic_report_codes,
      );
      reportTypes = reportCodes.map((code) => code.display);
      activityTitle = `Multiple reports ${faker.string.alphanumeric(8)}`;
      const createResponse = await page.request.post(
        `${apiOrigin}/api/v1/facility/${facilityId}/activity_definition/`,
        {
          headers,
          data: {
            title: activityTitle,
            slug_value: `multi-report-${faker.string.alphanumeric(8)}`,
            facility: facilityId,
            status: "active",
            classification: "laboratory",
            kind: "service_request",
            code: activity.code,
            description: "Multiple diagnostic report regression test",
            usage: "Multiple diagnostic report regression test",
            category: activity.category.slug,
            diagnostic_report_codes: reportCodes,
            observation_result_requirements:
              activity.observation_result_requirements.map((item) => item.slug),
            specimen_requirements: [],
            charge_item_definitions: [],
            locations: [],
            healthcare_service: null,
            body_site: null,
            derived_from_uri: null,
          },
        },
      );
      await expect(createResponse).toBeOK();
    } finally {
      await page.close();
    }
  });

  test("keeps each report's unsaved results when creating and saving another report", async ({
    page,
  }) => {
    const patientId = getPatientId();
    const encounterId = getEncounterId();
    const [firstReportType, secondReportType] = reportTypes;

    await test.step("Open a service request with two report types", async () => {
      await createServiceRequest(
        page,
        facilityId,
        patientId,
        encounterId,
        false,
        { activityDefinition: activityTitle },
      );
      await clickTabOrMenuItem(page, /service requests/i);
      await page
        .getByRole("row")
        .filter({ hasText: activityTitle })
        .getByRole("button", { name: "See Details" })
        .click();
    });

    const firstEntry = getReportCards(page, firstReportType).first();
    const secondEntry = getReportCards(page, secondReportType).first();
    const firstReview = getReportCards(page, firstReportType).last();
    const secondReview = getReportCards(page, secondReportType).last();
    const reportCards = getReportCards(page, firstReportType).or(
      getReportCards(page, secondReportType),
    );

    await test.step("Keep the first report's draft when creating a second report", async () => {
      await createReport(page, firstReportType);
      await firstEntry.getByPlaceholder("Result value").fill("101");
      await firstEntry.getByPlaceholder("Enter Conclusion").fill("First draft");

      await page
        .getByRole("button", { name: "Another Diagnostic Report" })
        .click();
      await createReport(page, secondReportType);

      await expect(reportCards.nth(0)).toContainText(firstReportType);
      await expect(reportCards.nth(1)).toContainText(secondReportType);
      await expect(firstEntry.getByPlaceholder("Result value")).toHaveValue(
        "101",
      );
      await expect(firstEntry.getByPlaceholder("Enter Conclusion")).toHaveValue(
        "First draft",
      );
      await secondEntry.getByPlaceholder("Result value").fill("202");
      await secondEntry
        .getByPlaceholder("Enter Conclusion")
        .fill("Second draft");
    });

    await test.step("Save the first report without resetting the second draft", async () => {
      await saveResults(page, firstEntry);
      await expect(reportCards.nth(0)).toContainText(firstReportType);
      await expect(reportCards.nth(1)).toContainText(secondReportType);
      await expect(
        firstEntry.getByPlaceholder("Result value"),
      ).not.toBeVisible();
      await expect(
        firstReview.getByRole("button", { name: "Approve Results" }),
      ).toBeVisible();
      await expect(
        firstReview.getByPlaceholder("Enter Conclusion"),
      ).toHaveValue("First draft");
      await expect(secondEntry.getByPlaceholder("Result value")).toHaveValue(
        "202",
      );
      await expect(
        secondEntry.getByPlaceholder("Enter Conclusion"),
      ).toHaveValue("Second draft");
    });

    await test.step("Keep an edited saved report when saving the other report", async () => {
      await firstEntry
        .locator('[data-slot="collapsible-trigger"]')
        .first()
        .click();
      await firstEntry.getByPlaceholder("Result value").fill("303");
      await firstEntry
        .getByPlaceholder("Enter Conclusion")
        .fill("Revised first draft");
      await saveResults(page, secondEntry);

      await expect(reportCards.nth(0)).toContainText(firstReportType);
      await expect(reportCards.nth(1)).toContainText(secondReportType);
      await expect(firstEntry.getByPlaceholder("Result value")).toHaveValue(
        "303",
      );
      await expect(firstEntry.getByPlaceholder("Enter Conclusion")).toHaveValue(
        "Revised first draft",
      );
      await expect(
        secondReview.getByPlaceholder("Enter Conclusion"),
      ).toHaveValue("Second draft");
    });

    await test.step("Reopen the correct review after saving that report again", async () => {
      await firstReview.locator('[data-slot="collapsible-trigger"]').click();
      await expect(
        firstReview.getByPlaceholder("Enter Conclusion"),
      ).not.toBeVisible();
      await saveResults(page, firstEntry);

      await expect(
        firstReview.getByRole("button", { name: "Approve Results" }),
      ).toBeVisible();
      await expect(
        firstReview.getByPlaceholder("Enter Conclusion"),
      ).toHaveValue("Revised first draft");

      await page.reload();
      await expect(firstEntry.getByPlaceholder("Result value")).toHaveValue(
        "303",
      );
      await expect(firstEntry.getByPlaceholder("Enter Conclusion")).toHaveValue(
        "Revised first draft",
      );
      await expect(secondEntry.getByPlaceholder("Result value")).toHaveValue(
        "202",
      );
      await expect(
        secondEntry.getByPlaceholder("Enter Conclusion"),
      ).toHaveValue("Second draft");
    });
  });
});
