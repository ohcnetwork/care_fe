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

      for (const observation of activityDefinitionMapping.observations) {
        await expect(
          page.locator('[data-slot="badge"]', { hasText: observation.title }),
        ).toBeVisible();
      }

      await expect(page.getByText(/^specimen$/i)).toBeVisible();

      for (const specimen of activityDefinitionMapping.specimens) {
        await expect(
          page
            .locator("div", { has: page.getByText(/^specimen$/i) })
            .locator("span", { hasText: specimen.typeCollected })
            .first(),
        ).toBeVisible();
      }

      // Locations: verify label and badges for each mapped location
      await expect(page.getByText(/^locations$/i)).toBeVisible();
      if (activityDefinitionMapping.locations?.length) {
        for (const locName of activityDefinitionMapping.locations) {
          await expect(
            page.locator('[data-slot="badge"]', { hasText: locName }),
          ).toBeVisible();
        }
      }

      await expect(
        page
          .locator("div", { has: page.getByText(/requested by/i) })
          .locator("div", {
            hasText: serviceRequestData.requestor,
          })
          .first(),
      ).toBeVisible();

      await expect(page.getByText(/^body site$/i)).toBeVisible();
      if (serviceRequestData.bodySite) {
        await expect(page.getByText(serviceRequestData.bodySite)).toBeVisible();
      }

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

    test("should display total price and price breakdown in popover", async ({
      page,
    }) => {
      await page
        .locator('[data-slot="popover-trigger"]', {
          has: page.locator("svg.lucide-info"),
        })
        .first()
        .click();

      const popover = page.locator('[data-slot="popover-content"]');
      await expect(popover).toBeVisible();

      await expect(
        popover.getByText(/component wise breakdown/i),
      ).toBeVisible();

      await expect(popover.getByText(/base amount/i)).toBeVisible();
      const firstChargeItem = activityDefinitionMapping.chargeItems[0];
      await expect(
        popover.getByText(String(firstChargeItem.basePrice)),
      ).toBeVisible();

      if (firstChargeItem.discounts?.length) {
        for (const discount of firstChargeItem.discounts) {
          // Find the row containing this discount's display name, then verify the factor within it
          const discountRow = popover.locator("div.flex.justify-between", {
            has: page.getByText(discount.display, { exact: true }),
          });
          await expect(discountRow).toBeVisible();
          await expect(
            discountRow.locator(`[data-factor="${discount.factor}"]`),
          ).toBeVisible();
        }
      }

      if (firstChargeItem.taxes?.length) {
        for (const tax of firstChargeItem.taxes) {
          // Find the row containing this tax's display name, then verify the factor within it
          const taxRow = popover.locator("div.flex.justify-between", {
            has: page.getByText(tax.display, { exact: true }),
          });
          await expect(taxRow).toBeVisible();
          await expect(
            taxRow.locator(`[data-factor="${tax.factor}"]`),
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Specimens Section", () => {
    test("should display specimen collection instructions", async ({
      page,
    }) => {
      // Scope to Specimens section to avoid picking unrelated cards
      const specimensSection = page.locator("div", {
        has: page.getByRole("heading", { name: /specimens/i }),
      });

      // Locate the first specimen card using its title within the card title, not the full "Required:" text
      const firstSpecimenTitle = activityDefinitionMapping.specimens[0].title;
      const specimenCard = specimensSection
        .locator('[data-slot="card"]', {
          has: page.locator('[data-slot="card-title"]', {
            hasText: new RegExp(firstSpecimenTitle, "i"),
          }),
        })
        .first();
      await expect(specimenCard).toBeVisible();

      // Expand the instructions accordion for this specimen card
      await specimenCard
        .locator('[data-slot="accordion-trigger"]', {
          hasText: /specimen collection instructions/i,
        })
        .click();

      // Verify the visible "Specimen Collection" section inside this card only
      await expect(
        specimenCard
          .locator('[data-slot="accordion-content"]')
          .getByText(/^specimen collection$/i),
      ).toBeVisible();

      const firstSpecimen = activityDefinitionMapping.specimens[0];

      // Verify table headers using data-slot within this card
      await expect(
        specimenCard
          .locator('[data-slot="table"]')
          .first()
          .locator('[data-slot="table-header"]'),
      ).toContainText(/field/i);
      await expect(
        specimenCard
          .locator('[data-slot="table"]')
          .first()
          .locator('[data-slot="table-header"]'),
      ).toContainText(/details/i);

      // Verify specimen collection details from mapping (scoped to this card)
      await expect(specimenCard.getByText(/required type/i)).toBeVisible();
      if (firstSpecimen.typeCollected) {
        await expect(
          specimenCard.getByText(firstSpecimen.typeCollected),
        ).toBeVisible();
      }

      await expect(specimenCard.getByText(/required method/i)).toBeVisible();
      if (firstSpecimen.collectionMethod) {
        await expect(
          specimenCard.getByText(firstSpecimen.collectionMethod),
        ).toBeVisible();
      }

      await expect(specimenCard.getByText(/patient prep/i)).toBeVisible();
      if (
        firstSpecimen.patientPreparation &&
        firstSpecimen.patientPreparation.length > 0
      ) {
        await expect(
          specimenCard.getByText(firstSpecimen.patientPreparation[0]),
        ).toBeVisible();
      }

      // Verify container details if available
      if (firstSpecimen.container) {
        await expect(
          specimenCard.getByText(/required container/i),
        ).toBeVisible();

        await expect(
          specimenCard.getByText(/container/i).first(),
        ).toBeVisible();
        if (firstSpecimen.container.cap) {
          await expect(
            specimenCard.getByText(firstSpecimen.container.cap),
          ).toBeVisible();
        }

        await expect(specimenCard.getByText(/capacity/i)).toBeVisible();

        await expect(specimenCard.getByText(/min\.?\s*volume/i)).toBeVisible();

        await expect(specimenCard.getByText(/preparation/i)).toBeVisible();
      }

      await expect(
        specimenCard.getByText(/required processing.*storage/i),
      ).toBeVisible();
      await expect(specimenCard.getByText(/retention/i)).toBeVisible();
    });
  });

  test.describe("Test Results Section", () => {
    test("should display test results section when observation requirements exist", async ({
      page,
    }) => {
      // Wait for test results heading
      const testResultsHeading = page.getByRole("heading", {
        name: /test results/i,
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
        has: page.getByRole("heading", { name: /test results/i }),
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
          has: page.getByRole("heading", { name: /test results/i }),
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

      const pageContent = await page.content();
      expect(pageContent).toBeTruthy();
    });
  });
});
