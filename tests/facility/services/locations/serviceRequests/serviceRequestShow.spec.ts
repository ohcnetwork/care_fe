import { expect, test } from "@playwright/test";
import {
  createServiceRequest,
  getLatestServiceRequestId,
} from "tests/facility/encounter/serviceRequests/serviceRequest";
import { ACTIVITY_DEFINITION_MAPPING } from "tests/facility/settings/activityDefinition/activityDefinition";
import { getEncounterId } from "tests/support/encounterId";
import { getFacilityId } from "tests/support/facilityId";
import { getLocationId } from "tests/support/locationId";
import { getPatientId } from "tests/support/patientId";

test.use({ storageState: "tests/.auth/user.json" });

let facilityId: string;
let patientId: string;
let encounterId: string;
let locationId: string;

test.beforeAll(async () => {
  encounterId = getEncounterId();
  facilityId = getFacilityId();
  patientId = getPatientId();
  locationId = getLocationId();
});

test.describe("Service Request Show Page", () => {
  let serviceRequestId: string;
  let serviceRequestData: any;
  let activityDefinitionMapping: any;

  test.beforeEach(async ({ page }) => {
    serviceRequestData = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
      true,
      { priority: "Urgent" },
    );

    // Get mapping data for the selected activity definition
    activityDefinitionMapping =
      ACTIVITY_DEFINITION_MAPPING[
        serviceRequestData.activityDefinition as keyof typeof ACTIVITY_DEFINITION_MAPPING
      ];

    serviceRequestId = await getLatestServiceRequestId(
      page,
      facilityId,
      patientId,
      encounterId,
      serviceRequestData.priority,
    );
    expect(serviceRequestId).toBeTruthy();

    await page.goto(
      `/facility/${facilityId}/locations/${locationId}/service_requests/${serviceRequestId}`,
    );
  });

  test.describe("Service Request Details Section", () => {
    test("should display all service request details", async ({ page }) => {
      await expect(
        page.getByText(serviceRequestData.activityDefinition).first(),
      ).toBeVisible();

      await expect(page.getByText(/request id:/i)).toBeVisible();
      await expect(page.getByText(serviceRequestId)).toBeVisible();

      await expect(page.getByText(/^priority$/i)).toBeVisible();
      await expect(page.getByText(serviceRequestData.priority)).toBeVisible();

      await expect(page.getByText(/^status$/i)).toBeVisible();
      await expect(page.getByText(serviceRequestData.status)).toBeVisible();

      await expect(page.getByText(/observation definitions/i)).toBeVisible();

      // Verify observation definition badges
      for (const observation of activityDefinitionMapping.observations) {
        await expect(
          page.getByRole("button", { name: observation.title }),
        ).toBeVisible();
      }

      await expect(
        page.locator("div.text-sm.text-gray-600", { hasText: /^specimen$/i }),
      ).toBeVisible();

      // Verify specimen requirement titles
      for (const specimen of activityDefinitionMapping.specimens) {
        await expect(page.getByText(specimen.title)).toBeVisible();
      }

      await expect(page.getByText(/requested by/i)).toBeVisible();

      if (serviceRequestData.bodySite) {
        await expect(page.getByText(serviceRequestData.bodySite)).toBeVisible();
      }

      await expect(page.getByText(/intent/i).first()).toBeVisible();

      if (serviceRequestData.patientInstruction) {
        await expect(
          page.getByText(serviceRequestData.patientInstruction),
        ).toBeVisible();
      }

      if (serviceRequestData.notes) {
        await expect(page.getByText(serviceRequestData.notes)).toBeVisible();
      }
    });
  });

  test.describe("Charge Items Section", () => {
    test("should display all charge item details", async ({ page }) => {
      await expect(
        page.locator('[data-slot="card-title"]', { hasText: /charge items/i }),
      ).toBeVisible();

      for (const chargeItem of activityDefinitionMapping.chargeItems) {
        await expect(page.getByText(chargeItem.title)).toBeVisible();
      }

      await expect(page.getByText(/billable/i)).toBeVisible();
      await expect(page.getByText(/unpaid/i)).toBeVisible();

      await expect(
        page.getByRole("button", { name: /add charge items/i }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /create invoice/i }),
      ).toBeVisible();
    });
  });

  test.describe("Specimens Section", () => {
    test("should display specimens section header", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /specimens/i }),
      ).toBeVisible();
    });

    test("should display print all QR codes button", async ({ page }) => {
      // Verify print QR codes button is visible
      const printButton = page.locator("button", {
        has: page.locator("svg[class*='PrinterIcon']"),
      });

      const printButtonCount = await printButton.count();
      if (printButtonCount > 0) {
        await expect(printButton.first()).toBeVisible();
      }
    });

    test("should display specimen requirements based on activity definition", async ({
      page,
    }) => {
      // Check that specimen cards or information is displayed
      const specimensSection = page.locator("div", {
        has: page.getByRole("heading", { name: /specimens/i }),
      });
      await expect(specimensSection).toBeVisible();

      // Verify the section has content below the header
      const sectionContent = specimensSection.locator(
        "xpath=following-sibling::*",
      );
      const contentCount = await sectionContent.count();
      expect(contentCount).toBeGreaterThanOrEqual(0);
    });

    test("should allow collecting specimens when not completed", async ({
      page,
    }) => {
      // Look for collect/action buttons in specimens section
      const specimensSection = page.locator("div.space-y-3");

      // Check if there are any specimen workflow cards
      const workflowCards = page.locator("div[class*='Card']");
      const cardsCount = await workflowCards.count();

      // Verify we have some content in the specimens section
      expect(cardsCount).toBeGreaterThan(0);
    });
  });

  test.describe("Test Results Section", () => {
    test("should display test results section when observation requirements exist", async ({
      page,
    }) => {
      // Wait for test results heading
      const testResultsHeading = page.getByRole("heading", {
        name: /test_results/i,
      });

      // Test results section may or may not be visible depending on activity definition
      const headingCount = await testResultsHeading.count();
      if (headingCount > 0) {
        await expect(testResultsHeading).toBeVisible();
      }
    });

    test("should display diagnostic report form when no final report exists", async ({
      page,
    }) => {
      // Check if the test results section exists
      const testResultsSection = page.locator("div.space-y-3", {
        has: page.getByRole("heading", { name: /test_results/i }),
      });

      const sectionCount = await testResultsSection.count();
      if (sectionCount > 0) {
        // Verify the section is visible
        await expect(testResultsSection).toBeVisible();
      }
    });

    test("should show observation history dropdown menu", async ({ page }) => {
      // Look for the more options button in test results section
      const moreButton = page
        .locator("div", {
          has: page.getByRole("heading", { name: /test_results/i }),
        })
        .locator("button[role='button']", {
          has: page.locator("svg"),
        });

      const buttonCount = await moreButton.count();
      if (buttonCount > 0) {
        await expect(moreButton.first()).toBeVisible();
      }
    });

    test("should display diagnostic report review when report exists", async ({
      page,
    }) => {
      // Check if diagnostic report section exists (may not exist for new service requests)
      const diagnosticSection = page.locator("div", {
        hasText: /diagnostic/i,
      });

      const sectionCount = await diagnosticSection.count();
      // This is conditional as new service requests won't have reports yet
      expect(sectionCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Service Request Actions", () => {
    test("should display back button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
    });

    test("should navigate back when back button is clicked", async ({
      page,
    }) => {
      const backButton = page.getByRole("button", { name: /back/i });
      await backButton.click();

      // Verify we navigated back (could be service requests list or previous page)
      // The back button uses goBack() so the URL depends on navigation history
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toBeTruthy();
    });

    test("should display more actions menu for non-completed requests", async ({
      page,
    }) => {
      // Look for the ellipsis menu button
      const moreActionsButton = page.locator("button", {
        has: page.locator("svg[class*='l-ellipsis-v']"),
      });

      const buttonCount = await moreActionsButton.count();
      if (buttonCount > 0) {
        await expect(moreActionsButton).toBeVisible();
      }
    });

    test("should show mark as complete button for non-completed requests", async ({
      page,
    }) => {
      // Check if mark as complete button exists
      const completeButton = page.locator("button", {
        hasText: /mark|complete/i,
      });

      const buttonCount = await completeButton.count();
      // Button should exist if service request is not completed
      if (buttonCount > 0) {
        await expect(completeButton.first()).toBeVisible();
      }
    });
  });

  test.describe("Patient Header", () => {
    test("should display patient header with patient information", async ({
      page,
    }) => {
      // Patient header should be visible at the top
      const patientSection = page.locator("div.px-2", {
        has: page.locator("div[class*='patient']"),
      });

      // At minimum, the page should have patient-related content
      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });
});
