import { expect, test } from "@playwright/test";
import { clickTabOrMenuItem, expectToast } from "tests/helper/ui";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getPatientId } from "tests/support/patientId";
import { createServiceRequest } from "./serviceRequest";

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

  test("ensure unit is autofilled for observations in service request", async ({
    page,
  }) => {
    await page.goto(`/facility/${facilityId}/settings/observation_definitions`);
    // Use fixed pair to avoid collisions with tests 1 & 2 which randomly pick definitions
    const observationDefinitionTitle = "Urinalysis Observation";
    const activityDefinitionTitle = "Urinalysis";
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
    await page.goto(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );

    await page.getByRole("tab", { name: "Service Requests" }).click();
    await page.getByRole("link", { name: "Create Service Request" }).click();
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Activity Definition" })
      .click();
    await page
      .getByPlaceholder("Search activity definitions")
      .fill(activityDefinitionTitle);
    await page
      .locator('[data-slot="command-item"]', {
        hasText: activityDefinitionTitle,
      })
      .first()
      .click();
    await expect(page.locator("#question-service_request")).toBeVisible();
    const submitButton = page.getByRole("button", { name: "Submit" });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    await expectToast(page, /questionnaire submitted successfully/i);
    await expect(page).toHaveURL(
      `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`,
    );
    await clickTabOrMenuItem(page, /service requests/i);
    await expect(page).toHaveURL(/\/service_requests$/);
    await page
      .locator('[data-slot="table-body"] [data-slot="table-row"]')
      .filter({ hasText: activityDefinitionTitle })
      .first()
      .getByRole("button", { name: "See Details" })
      .click();
    await page.waitForLoadState("networkidle");
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
      name: "Collect ⇧ + ENTER",
    });
    await expect(collectButton).toBeEnabled();
    const specimenResponse = page.waitForResponse(
      (resp) =>
        resp.url().includes("/specimen/") &&
        resp.request().method() === "PUT" &&
        resp.status() === 200,
    );
    const specimenCollectedToast = expectToast(page, /specimen collected/i);
    await collectButton.click();
    await specimenResponse;
    await specimenCollectedToast;
    await page
      .getByRole("combobox")
      .filter({ hasText: "Select Diagnostic Report Type" })
      .click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Create Report" }).click();
    const observationCombobox = page
      .locator('[data-slot="card-content"]')
      .filter({ hasText: "Observation 1" })
      .getByRole("combobox");
    await observationCombobox.scrollIntoViewIfNeeded();
    await expect(observationCombobox).toContainText("mg");
  });
});
