import { faker } from "@faker-js/faker";
import { expect, Page, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { clickTabOrMenuItem, expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";
import {
  ACTIVITY_DEFINITIONS,
  createServiceRequest,
  OBSERVATION_DEFINITIONS,
} from "./serviceRequest";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let patientId: string;
let encounterId: string;

test.beforeAll(async () => {
  encounterId = getEncounterId();
  facilityId = getFacilityId();
  patientId = getPatientId();
});

test.describe("Patient Service Request Tab", () => {
  test("should create a service request with required fields", async ({
    page,
  }) => {
    const serviceRequestData = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
    );

    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );

    await clickTabOrMenuItem(page, /service requests/i);
    await expect(page).toHaveURL(/\/service_requests$/);

    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    await expect(
      firstRow.getByText(serviceRequestData.activityDefinition).first(),
    ).toBeVisible();

    await expect(firstRow.getByText("Active")).toBeVisible();

    await expect(firstRow.getByText(serviceRequestData.priority)).toBeVisible();
  });

  test("should create a service request with all fields", async ({ page }) => {
    const serviceRequestData = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
      true,
    );

    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );

    await clickTabOrMenuItem(page, /service requests/i);
    await expect(page).toHaveURL(/\/service_requests$/);

    const firstRow = page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .first();

    await expect(
      firstRow.getByText(serviceRequestData.activityDefinition).first(),
    ).toBeVisible();

    await expect(firstRow.getByText(serviceRequestData.status)).toBeVisible();

    await expect(firstRow.getByText(serviceRequestData.priority)).toBeVisible();

    // Verify details in the detail view
    await firstRow.getByRole("button", { name: "See Details" }).click();

    await expect(
      page
        .locator("div")
        .filter({ hasText: serviceRequestData.activityDefinition })
        .first(),
    ).toBeVisible();

    await expect(page.getByText(serviceRequestData.notes!)).toBeVisible();

    await expect(
      page
        .locator("div")
        .filter({ hasText: serviceRequestData.requestor! })
        .first(),
    ).toBeVisible();
  });

  async function navigateToEncounterPage(page: Page) {
    const facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    await page.getByText("View Encounter").first().click();
  }

  test("ensure unit is autofilled for observations in service request", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/settings/observation_definitions`);
    const observationDefinitionTitle = faker.helpers.arrayElement(
      OBSERVATION_DEFINITIONS,
    );
    const activityDefinitionTitle = ACTIVITY_DEFINITIONS.find((title) =>
      observationDefinitionTitle.includes(title),
    )!;
    await page
      .getByRole("textbox", { name: "Search definitions" })
      .fill(observationDefinitionTitle);
    await page.getByRole("link", { name: "Edit" }).click();
    await page.getByRole("combobox", { name: "Data Type *" }).click();
    await page.getByRole("option", { name: "String" }).click();
    await page.getByRole("combobox", { name: "Unit" }).click();
    await page.getByPlaceholder("Select Unit").fill("milligram");
    await page.getByRole("option", { name: "milligram (mg)" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await navigateToEncounterPage(page);

    await page.getByRole("tab", { name: "Service Requests" }).click();
    await page.getByRole("link", { name: "Create Service Request" }).click();
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Activity Definition" })
      .click();
    await page
      .getByPlaceholder("Search activity definitions")
      .fill(activityDefinitionTitle);
    await page.getByRole("option", { name: activityDefinitionTitle }).click();
    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByRole("tab", { name: "Service Requests" }).click();
    await page.getByRole("button", { name: "See Details" }).first().click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Collect Specimen" }).click();
    await expect(page.getByText("Sample Identification")).toBeVisible();
    await page.getByPlaceholder("Value", { exact: true }).fill("2");
    await expect(page.getByPlaceholder("Value", { exact: true })).toHaveValue(
      "2",
    );
    await page
      .getByRole("textbox", { name: "Type your Notes" })
      .fill("Test Notes");
    await expect(
      page.getByRole("button", { name: "Collect ⇧ + ENTER" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Collect ⇧ + ENTER" }).click();
    await expectToast(page, /specimen collected/i);
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Diagnostic Report Type" })
      .click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Create Report" }).click();
    await expect(page.getByRole("combobox")).toContainText("mg");
  });
});
