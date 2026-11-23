import { expect, test } from "@playwright/test";
import { createQuestionnaireEncounter } from "tests/helper/questionnaire";
import { clickTabOrMenuItem, expectToast } from "tests/helper/ui";
import { getFacilityId } from "tests/support/facilityId";
import {
  collectSpecimenViaUi,
  createDiagnosticReportViaUi,
  createLabActivityDefinitionViaApi,
  createServiceRequest,
  fillDiagnosticResultValue,
  openServiceRequestDetails,
  saveDiagnosticResults,
} from "./serviceRequest";

import type { QuestionType } from "../../../../../src/types/emr/observationDefinition/observationDefinition";

test.use({
  storageState: "tests/.auth/user.json",
  // Use Chromium's fake media stream so the in-browser camera capture works
  // headlessly and permission prompts are auto-accepted.
  permissions: ["camera"],
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});

let facilityId: string;
let patientId: string;
let encounterId: string;

test.beforeEach(async () => {
  facilityId = getFacilityId();
  ({ patientId, encounterId } = await createQuestionnaireEncounter(facilityId));
});

test.describe("Patient Service Request Tab", () => {
  test(
    "should create a service request with required fields",
    { tag: ["@atomic", "@cap:encounter.servicerequest.create"] },
    async ({ page }) => {
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

      await expect(
        firstRow.getByText(serviceRequestData.priority),
      ).toBeVisible();
    },
  );

  test(
    "should create a service request with all fields",
    { tag: ["@atomic", "@cap:encounter.servicerequest.create"] },
    async ({ page }) => {
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

      await expect(
        firstRow.getByText(serviceRequestData.priority),
      ).toBeVisible();

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
    },
  );

  test(
    "ensure unit is autofilled for observations in service request",
    { tag: ["@atomic", "@cap:encounter.diagnosticreport.result.enter"] },
    async ({ page }) => {
      // Edit a copy of the Urinalysis definitions, not the shared fixture that
      // other service request tests use.
      const { activityTitle, observationTitle } =
        await createLabActivityDefinitionViaApi({ facilityId });

      await page.goto(
        `/facility/${facilityId}/settings/observation_definitions`,
      );
      const observationDefinitionTitle = observationTitle;
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
      // A fresh definition has no unit yet, so the edit must land before the
      // service request is created.
      await expectToast(page, "Observation definition updated successfully");

      const serviceRequestData = await createServiceRequest(
        page,
        facilityId,
        patientId,
        encounterId,
        false,
        { activityDefinition: activityTitle },
      );

      await openServiceRequestDetails(
        page,
        serviceRequestData.activityDefinition,
      );
      await collectSpecimenViaUi(page);
      await createDiagnosticReportViaUi(page);
      const observationGroup = page.getByRole("group", {
        name: observationDefinitionTitle,
        exact: true,
      });
      const result = observationGroup.getByRole("textbox", {
        name: observationDefinitionTitle,
        exact: true,
      });
      await result.scrollIntoViewIfNeeded();
      await expect(
        observationGroup.getByText("mg", { exact: true }),
      ).toBeVisible();
      await expect(result).toHaveAccessibleDescription("mg");
    },
  );
});

test(
  "should fill result value, capture a photo and save results",
  { tag: ["@atomic", "@cap:encounter.diagnosticreport.result.enter"] },
  async ({ page }) => {
    // A string-valued copy of Urinalysis: the shared definition's data type is
    // what another test used to change.
    const { activityTitle } = await createLabActivityDefinitionViaApi({
      facilityId,
      observation: { permitted_data_type: "string" as QuestionType },
    });
    const serviceRequestData = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
      false,
      { activityDefinition: activityTitle },
    );

    // Open the service request detail view
    await openServiceRequestDetails(
      page,
      serviceRequestData.activityDefinition,
    );

    // Collect the specimen so a diagnostic report can be created
    await collectSpecimenViaUi(page);

    // Create the diagnostic report
    await createDiagnosticReportViaUi(page);

    // Fill the result value
    await fillDiagnosticResultValue(page, "5");

    // Take a photo using the in-browser camera
    await page.getByRole("button", { name: "Take Photo" }).click();
    const cameraSheet = page.getByRole("dialog", {
      name: "Camera",
      exact: true,
    });
    await expect
      .poll(() =>
        cameraSheet
          .locator("video")
          .evaluate(
            (video: HTMLVideoElement) =>
              video.readyState >= video.HAVE_CURRENT_DATA,
          ),
      )
      .toBe(true);

    // Capture button (the large circular shutter)
    const captureButton = cameraSheet.locator("button", {
      has: page.locator("div.border-black"),
    });
    await expect(captureButton).toBeVisible();
    await captureButton.click();

    // Confirm the captured preview
    const confirmButton = cameraSheet.locator("button", {
      has: page.locator("svg.lucide-check"),
    });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // The upload dialog opens with the captured file
    const uploadDialog = page.getByRole("dialog", { name: /upload file/i });
    await expect(uploadDialog).toBeVisible();
    await uploadDialog
      .getByPlaceholder("Enter File Name")
      .fill(`capture-${Date.now()}`);
    const uploadSuccessToast = expectToast(page, /file uploaded successfully/i);
    await Promise.all([
      uploadDialog.getByRole("button", { name: "Upload" }).click(),
      uploadSuccessToast,
    ]);

    // Save the results
    await saveDiagnosticResults(page);
  },
);
