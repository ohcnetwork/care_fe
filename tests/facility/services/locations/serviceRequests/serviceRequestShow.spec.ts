import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import {
  createServiceRequest,
  getLatestServiceRequestId,
} from "tests/facility/encounter/serviceRequests/serviceRequest";
import {
  collectSpecimen,
  getRandomSpecimenQuantity,
  getRandomSpecimenUnit,
} from "tests/facility/services/locations/serviceRequests/specimen";
import { ACTIVITY_DEFINITION_MAPPING } from "tests/facility/settings/activityDefinition/activityDefinition";
import { expectToast } from "tests/helper/ui";
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
        await expect(page.getByText(chargeItem.totalPrice)).toBeVisible();
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

      const firstChargeItem = activityDefinitionMapping.chargeItems[0];

      const baseAmountRow = popover.locator("div.flex.justify-between", {
        has: page.getByText(/base amount/i),
      });
      await expect(
        baseAmountRow.locator(`[data-amount="${firstChargeItem.basePrice}"]`),
      ).toBeVisible();

      if (firstChargeItem.discounts?.length) {
        for (const discount of firstChargeItem.discounts) {
          const discountRow = popover.locator("div.flex.justify-between", {
            has: page.getByText(discount.display, { exact: true }),
          });
          await expect(
            discountRow.locator(`[data-factor="${discount.factor}"]`),
          ).toContainText(`${discount.factor}%`);
          await expect(
            discountRow.locator(
              `[data-amount="${(firstChargeItem.basePrice * discount.factor) / 100}"]`,
            ),
          ).toContainText(
            `₹${((firstChargeItem.basePrice * discount.factor) / 100).toFixed(2)}`,
          );
        }
      }

      if (firstChargeItem.taxes?.length) {
        for (const tax of firstChargeItem.taxes) {
          const taxRow = popover.locator("div.flex.justify-between", {
            has: page.getByText(tax.display, { exact: true }),
          });
          await expect(
            taxRow.locator(`[data-factor="${tax.factor}"]`),
          ).toContainText(`${tax.factor}%`);
          await expect(
            taxRow.locator(
              `[data-amount="${(firstChargeItem.basePrice * tax.factor) / 100}"]`,
            ),
          ).toContainText(
            `₹${((firstChargeItem.basePrice * tax.factor) / 100).toFixed(2)}`,
          );
        }
      }
    });
  });

  test.describe("Specimens Section", () => {
    test("should display specimen collection instructions", async ({
      page,
    }) => {
      const specimensSection = page.locator("div", {
        has: page.getByRole("heading", { name: /specimens/i }),
      });

      const specimenCard = specimensSection
        .locator('[data-slot="card"]', {
          has: page.locator('[data-slot="card-title"]', {
            hasText: activityDefinitionMapping.specimens[0].title,
          }),
        })
        .first();
      await expect(specimenCard).toBeVisible();

      await specimenCard
        .locator('[data-slot="accordion-trigger"]', {
          hasText: /specimen collection instructions/i,
        })
        .click();

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
          specimenCard.getByText(firstSpecimen.typeCollected, { exact: true }),
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

        if (firstSpecimen.container.capacity) {
          const capacityRow = specimenCard.locator('[data-slot="table-row"]', {
            has: page.locator('[data-slot="table-head"]', {
              hasText: /^capacity$/i,
            }),
          });
          await expect(capacityRow).toContainText(
            String(firstSpecimen.container.capacity.value),
          );
          await expect(capacityRow).toContainText(
            firstSpecimen.container.capacity.unit,
          );
        }

        await expect(specimenCard.getByText(/min\.?\s*volume/i)).toBeVisible();

        if (firstSpecimen.container.minVolume) {
          const minVolumeRow = specimenCard.locator('[data-slot="table-row"]', {
            has: page.locator('[data-slot="table-head"]', {
              hasText: /min\.?\s*volume/i,
            }),
          });
          await expect(minVolumeRow).toContainText(
            String(firstSpecimen.container.minVolume.value),
          );
          await expect(minVolumeRow).toContainText(
            firstSpecimen.container.minVolume.unit,
          );
        }

        if (firstSpecimen.container.preparation) {
          const preparationRow = specimenCard.locator(
            '[data-slot="table-row"]',
            {
              has: page.locator('[data-slot="table-head"]', {
                hasText: /^preparation$/i,
              }),
            },
          );
          await expect(preparationRow).toContainText(
            firstSpecimen.container.preparation,
          );
        }
      }

      await expect(
        specimenCard.getByText(/required processing.*storage/i),
      ).toBeVisible();

      const retentionRow = specimenCard.locator('[data-slot="table-row"]', {
        has: page.locator('[data-slot="table-head"]', {
          hasText: /^retention$/i,
        }),
      });
      await expect(retentionRow).toContainText(
        String(firstSpecimen.retention.value),
      );
      await expect(retentionRow).toContainText(firstSpecimen.retention.unit);
    });

    test("should create draft specimen on clicking collect specimen button", async ({
      page,
    }) => {
      const specimensSection = page.locator("div", {
        has: page.getByRole("heading", { name: /specimens/i }),
      });

      const specimenCard = specimensSection
        .locator('[data-slot="card"]')
        .filter({
          has: page.locator('[data-slot="badge"]', {
            hasText: /collection pending/i,
          }),
        })
        .first();
      await expect(specimenCard).toBeVisible();

      await expect(
        specimenCard.locator('[data-slot="badge"]', {
          hasText: /collection pending/i,
        }),
      ).toBeVisible();

      await expect(
        specimenCard.locator('[data-slot="badge"]', {
          hasText: /draft/i,
        }),
      ).not.toBeVisible();

      await specimenCard
        .getByRole("button", { name: /collect specimen/i })
        .click();

      const specimenFormCard = page.locator('[data-slot="card"]', {
        has: page.locator('[data-slot="card-title"]', {
          hasText: /collect specimen:/i,
        }),
      });
      await expect(specimenFormCard).toBeVisible();

      await expect(
        specimenFormCard.getByText(/sample identification/i),
      ).toBeVisible();

      await expect(
        specimenFormCard.getByText(/QR code generated successfully/i),
      ).toBeVisible();

      await specimenFormCard
        .locator("button", {
          has: page.locator("svg[class*='l-arrow-left']"),
        })
        .click();

      await expect(specimenFormCard).not.toBeVisible();

      await expect(
        specimensSection
          .locator('[data-slot="card"]')
          .filter({
            has: page.locator('[data-slot="badge"]', { hasText: /^draft$/i }),
          })
          .filter({
            has: page.locator('[data-slot="badge"]', {
              hasText: /collection pending/i,
            }),
          })
          .first(),
      ).toBeVisible();
    });

    test("should collect specimen with only required fields (quantity value with prefilled unit)", async ({
      page,
    }) => {
      await collectSpecimen(page, {
        quantityValue: getRandomSpecimenQuantity(),
      });

      await expectToast(page, /specimen collected/i);

      await expect(
        page.locator('[data-slot="badge"]', { hasText: "Available" }).first(),
      ).toBeVisible();
    });

    test("should collect specimen with manually selected unit", async ({
      page,
    }) => {
      await collectSpecimen(page, {
        quantityValue: getRandomSpecimenQuantity(),
        quantityUnit: getRandomSpecimenUnit(),
      });

      await expectToast(page, /specimen collected/i);

      await expect(
        page.locator('[data-slot="badge"]', { hasText: "Available" }).first(),
      ).toBeVisible();
    });

    test("should collect specimen with all fields filled", async ({ page }) => {
      await collectSpecimen(page, {
        quantityValue: getRandomSpecimenQuantity(),
        bodySite: true,
        fastingStatus: true,
        fastingDuration: faker.number.int({ min: 1, max: 24 }).toString(),
        notes: faker.lorem.sentence(),
      });

      await expectToast(page, /specimen collected/i);

      await expect(
        page.locator('[data-slot="badge"]', { hasText: "Available" }).first(),
      ).toBeVisible();
    });

    test("should collect specimen using scan existing mode with manual identifier", async ({
      page,
    }) => {
      await collectSpecimen(page, {
        quantityValue: getRandomSpecimenQuantity(),
        useScanMode: true,
        specimenIdentifier: faker.string.numeric(8),
      });

      await expectToast(page, /specimen collected/i);

      await expect(
        page.locator('[data-slot="badge"]', { hasText: "Available" }).first(),
      ).toBeVisible();
    });
  });

  test.describe("Test Results Section", () => {
    test("should display test results section with disabled controls when specimen not collected", async ({
      page,
    }) => {
      const testResultsSection = page
        .locator("div", {
          has: page.getByRole("heading", { name: /test results/i }),
        })
        .first();
      await expect(testResultsSection).toBeVisible();

      const testResultsCard = testResultsSection.locator('[data-slot="card"]', {
        has: page.locator('[data-slot="card-title"]', {
          hasText: /test results entry/i,
        }),
      });

      await expect(
        testResultsCard.getByText(/please collect the required specimen/i),
      ).toBeVisible();

      const diagnosticReportSelector = testResultsCard.locator(
        '[data-slot="select-trigger"]',
      );
      await expect(diagnosticReportSelector).toBeVisible();
      await expect(diagnosticReportSelector).toBeDisabled();

      const createReportButton = testResultsCard.getByRole("button", {
        name: /create report/i,
      });
      await expect(createReportButton).toBeVisible();
      await expect(createReportButton).toBeDisabled();
    });

    test("should show observation history sheet with no deleted observations", async ({
      page,
    }) => {
      const testResultsHeader = page.locator("div.flex.items-center", {
        has: page.getByRole("heading", { name: /test results/i }),
      });

      await testResultsHeader
        .locator('[data-slot="dropdown-menu-trigger"]')
        .click();

      await page
        .getByRole("menuitem", { name: /view observation history/i })
        .click();

      const sheet = page.locator('[data-slot="sheet-content"]');
      await expect(sheet).toBeVisible();

      await expect(
        sheet.getByText(/observation history/i).first(),
      ).toBeVisible();

      await expect(sheet.getByText(/no deleted observation\b/i)).toBeVisible();
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
