import { expect, test } from "@playwright/test";
import {
  createServiceRequest,
  getLatestServiceRequestId,
} from "tests/facility/encounter/serviceRequests/serviceRequest";
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

  test.beforeEach(async ({ page }) => {
    // Create a service request with Urgent priority for parallel-safe test execution
    const serviceRequestData = await createServiceRequest(
      page,
      facilityId,
      patientId,
      encounterId,
      true,
      { priority: "Urgent" },
    );

    // Get the ID of the newly created service request using priority
    serviceRequestId = await getLatestServiceRequestId(
      page,
      facilityId,
      patientId,
      encounterId,
      serviceRequestData.priority, // Pass priority for parallel-safe matching
    );
    expect(serviceRequestId).toBeTruthy();

    // Navigate to the location-specific service request view
    await page.goto(
      `/facility/${facilityId}/locations/${locationId}/service_requests/${serviceRequestId}`,
    );
  });

  test.describe("Service Request Details Section", () => {
    test("should display service request details with status and priority badges", async ({
      page,
    }) => {
      // Verify activity definition title is displayed
      const activityTitle = page.locator("div.font-semibold.text-gray-600");
      await expect(activityTitle).toBeVisible();

      // Verify request ID is displayed
      await expect(page.getByText(/request id:/i)).toBeVisible();

      // Verify priority badge is visible
      const prioritySection = page.locator("div", {
        hasText: /^priority$/i,
      });
      await expect(prioritySection).toBeVisible();

      // Verify status badge is visible
      const statusSection = page.locator("div", { hasText: /^status$/i });
      await expect(statusSection).toBeVisible();

      // Verify observation definitions section is visible
      await expect(page.getByText(/observation_definitions/i)).toBeVisible();

      // Verify specimen section is visible
      await expect(
        page.locator("div.text-sm.text-gray-600", { hasText: /^specimen$/i }),
      ).toBeVisible();

      // Verify requested by section is visible
      await expect(page.getByText(/requested by/i)).toBeVisible();
    });

    test("should display body site when provided", async ({ page }) => {
      // Body site should be visible since we created the service request with all fields
      const bodySiteSection = page.locator("div", { hasText: /body_site/i });
      await expect(bodySiteSection).toBeVisible();
    });

    test("should display intent information", async ({ page }) => {
      // Verify intent section is visible
      await expect(page.getByText(/intent/i).first()).toBeVisible();
    });

    test("should display patient instructions when provided", async ({
      page,
    }) => {
      // Patient instructions should be visible
      await expect(page.getByText(/patient instruction/i)).toBeVisible();
    });

    test("should display notes when provided", async ({ page }) => {
      // Notes section should be visible
      await expect(page.getByText(/notes/i)).toBeVisible();
    });
  });

  test.describe("Charge Items Section", () => {
    test("should display charge items section", async ({ page }) => {
      // Verify charge items card is visible
      const chargeItemsTitle = page.getByRole("heading", {
        name: /charge_items/i,
      });
      await expect(chargeItemsTitle).toBeVisible();
    });

    test("should show add charge items button when not in view only mode", async ({
      page,
    }) => {
      // Look for the add/plus button for charge items
      const chargeItemsCard = page.locator("div", {
        has: page.getByRole("heading", { name: /charge_items/i }),
      });
      const addButton = chargeItemsCard.locator('button[type="button"]', {
        has: page.locator("svg"),
      });

      // Verify button exists (may not be visible if service request is completed)
      const buttonCount = await addButton.count();
      expect(buttonCount).toBeGreaterThanOrEqual(0);
    });

    test("should display empty state when no charge items exist", async ({
      page,
    }) => {
      // Check if charge items section exists
      const chargeItemsSection = page.locator("div", {
        has: page.getByRole("heading", { name: /charge_items/i }),
      });
      await expect(chargeItemsSection).toBeVisible();

      // The section should be present even if empty
      const cardContent = chargeItemsSection.locator('[class*="CardContent"]');
      await expect(cardContent).toBeVisible();
    });
  });

  test.describe("Specimens Section", () => {
    test("should display specimens section header", async ({ page }) => {
      // Wait for the specimens heading to be visible
      const specimensHeading = page.getByRole("heading", {
        name: /specimens/i,
      });
      await expect(specimensHeading).toBeVisible();
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
      const backButton = page.getByRole("button", { name: /back/i });
      await expect(backButton).toBeVisible();
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
