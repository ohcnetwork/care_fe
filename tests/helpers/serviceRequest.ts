import { Priority } from "@/src/types/emr/serviceRequest/serviceRequest";
import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import {
  expectToast,
  selectFromDefinitionCategoryPicker,
  selectFromValueSet,
} from "tests/helpers/ui";

/**
 * Options for generating service request test data
 */
export interface ServiceRequestTestDataOptions {
  activityDefinition?: string;
  navigateCategories?: string[];
  bodySite?: string;
  priority?: Priority;
  patientInstruction?: string;
  notes?: string;
}

/**
 * Generated service request test data
 */
export interface ServiceRequestTestData {
  activityDefinition: string;
  bodySite: string;
  priority: Priority;
  patientInstruction: string;
  notes: string;
}

/**
 * Common activity definitions for testing
 */
export const COMMON_ACTIVITY_DEFINITIONS = {
  CBC: "Complete Blood Count (CBC) Panel",
  LIPID_PANEL: "Lipid Panel",
  METABOLIC_PANEL: "Comprehensive Metabolic Panel",
  THYROID: "Thyroid Function Panel",
} as const;

/**
 * Common body sites for testing
 */
export const COMMON_BODY_SITES = {
  BLOOD: "Blood",
  ARM: "Arm",
  LEG: "Leg",
  CHEST: "Chest",
} as const;

/**
 * Generates dynamic test data for service request fields.
 * Uses faker to generate random but realistic test data.
 *
 * @param options - Optional overrides for default values
 * @returns Service request test data object with navigateCategories
 *
 * @example
 * ```typescript
 * // Use defaults
 * const data = generateServiceRequestTestData();
 *
 * // Override specific fields
 * const data = generateServiceRequestTestData({
 *   activityDefinition: COMMON_ACTIVITY_DEFINITIONS.LIPID_PANEL,
 *   bodySite: COMMON_BODY_SITES.ARM,
 *   priority: Priority.urgent,
 * });
 *
 * // Use with faker for unique data
 * const data = generateServiceRequestTestData({
 *   patientInstruction: faker.lorem.paragraph(),
 *   notes: faker.lorem.sentences(2),
 *   priority: Priority.stat,
 * });
 * ```
 */
export function generateServiceRequestTestData(
  options: ServiceRequestTestDataOptions = {},
): ServiceRequestTestData & { navigateCategories: string[] } {
  const {
    activityDefinition = COMMON_ACTIVITY_DEFINITIONS.CBC,
    bodySite = COMMON_BODY_SITES.BLOOD,
    priority = Priority.routine,
    patientInstruction = faker.lorem.sentence(),
    notes = faker.lorem.sentence(),
    navigateCategories = ["Lab Tests"],
  } = options;

  return {
    activityDefinition,
    bodySite,
    priority,
    patientInstruction,
    notes,
    navigateCategories,
  };
}

/**
 * Generates multiple service request test data sets.
 * Useful for testing lists, filters, and bulk operations.
 *
 * @param count - Number of test data sets to generate
 * @param baseOptions - Base options applied to all generated data sets
 * @returns Array of service request test data objects
 *
 * @example
 * ```typescript
 * // Generate 3 service requests with default values
 * const dataSets = generateMultipleServiceRequestTestData(3);
 *
 * // Generate with custom base options
 * const dataSets = generateMultipleServiceRequestTestData(3, {
 *   navigateCategories: ["Lab Tests"],
 * });
 * ```
 */
export function generateMultipleServiceRequestTestData(
  count: number,
  baseOptions: ServiceRequestTestDataOptions = {},
): Array<ServiceRequestTestData & { navigateCategories: string[] }> {
  return Array.from({ length: count }, () =>
    generateServiceRequestTestData({
      ...baseOptions,
      patientInstruction:
        baseOptions.patientInstruction || faker.lorem.sentence(),
      notes: baseOptions.notes || faker.lorem.sentence(),
    }),
  );
}

/**
 * Creates a service request via the UI and returns the created data.
 * Navigates to the service request form, fills it out, and submits.
 *
 * @param page - Playwright page instance
 * @param facilityId - Facility ID
 * @param patientId - Patient ID
 * @param encounterId - Encounter ID
 * @param options - Optional overrides for default values
 * @returns The service request data that was created
 *
 * @example
 * ```typescript
 * // Use defaults (priority defaults to routine)
 * const data = await createServiceRequest(
 *   page,
 *   facilityId,
 *   patientId,
 *   encounterId,
 * );
 *
 * // Custom priority
 * const data = await createServiceRequest(
 *   page,
 *   facilityId,
 *   patientId,
 *   encounterId,
 *   { priority: Priority.urgent }
 * );
 * ```
 */
export async function createServiceRequest(
  page: Page,
  facilityId: string,
  patientId: string,
  encounterId: string,
  options: ServiceRequestTestDataOptions = {},
): Promise<ServiceRequestTestData> {
  const testData = generateServiceRequestTestData(options);

  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
  );

  await page.getByRole("button", { name: /create service request/i }).click();

  const activityDefinitionPicker = page
    .locator('button[role="combobox"]')
    .filter({ hasText: /select activity definition/i });
  await activityDefinitionPicker.waitFor({ state: "visible" });

  await selectFromDefinitionCategoryPicker(page, activityDefinitionPicker, {
    navigateCategories: testData.navigateCategories || ["Lab Tests"],
    search: testData.activityDefinition,
    itemIndex: 0,
  });

  const bodySiteSelector = page
    .locator('button[role="combobox"]')
    .filter({ hasText: /body site/i });
  await bodySiteSelector.waitFor({ state: "visible" });

  await selectFromValueSet(page, bodySiteSelector, {
    search: testData.bodySite,
  });

  const prioritySelector = page
    .locator('button[role="combobox"][data-slot="select-trigger"]')
    .filter({ hasText: /routine|urgent|asap|stat/i })
    .first();

  // Only change priority if it's different from the default
  const currentValue = await prioritySelector.textContent();
  if (!currentValue?.toLowerCase().includes(testData.priority.toLowerCase())) {
    await prioritySelector.click();

    await page
      .getByRole("option")
      .filter({ hasText: new RegExp(testData.priority, "i") })
      .first()
      .click();
  }

  await page
    .getByPlaceholder(/enter patient instruction/i)
    .fill(testData.patientInstruction);

  await page.getByPlaceholder(/add note/i).fill(testData.notes);

  await page.getByRole("button", { name: /add/i }).click();
  await page.getByRole("button", { name: /submit/i }).click();

  await expectToast(page, /questionnaire submitted successfully/i);

  return {
    activityDefinition: testData.activityDefinition,
    bodySite: testData.bodySite,
    priority: testData.priority,
    patientInstruction: testData.patientInstruction,
    notes: testData.notes,
  };
}

/**
 * Creates a service request and returns the service request ID from the URL.
 * Useful when you need the ID for subsequent operations.
 *
 * @param page - Playwright page instance
 * @param facilityId - Facility ID
 * @param patientId - Patient ID
 * @param encounterId - Encounter ID
 * @param options - Optional overrides for default values
 * @returns Object containing the service request ID and data
 *
 * @example
 * ```typescript
 * const { id, data } = await createServiceRequestAndGetId(
 *   page,
 *   facilityId,
 *   patientId,
 *   encounterId
 * );
 * ```
 */
export async function createServiceRequestAndGetId(
  page: Page,
  facilityId: string,
  patientId: string,
  encounterId: string,
  options: ServiceRequestTestDataOptions = {},
): Promise<{ id: string; data: ServiceRequestTestData }> {
  const data = await createServiceRequest(
    page,
    facilityId,
    patientId,
    encounterId,
    options,
  );

  // Navigate to service requests list to get the ID
  await page.getByRole("tab", { name: /service requests/i }).click();
  await page.waitForURL(/\/service_requests$/);

  // Click on the created service request to get its ID from URL
  await page.getByText(data.activityDefinition).click();

  // Extract ID from URL: /facility/.../service_requests/{id}
  const url = page.url();
  const idMatch = url.match(/\/service_requests\/([^/]+)/);
  const id = idMatch ? idMatch[1] : "";

  if (!id) {
    throw new Error(`Could not extract service request ID from URL: ${url}`);
  }

  return { id, data };
}
