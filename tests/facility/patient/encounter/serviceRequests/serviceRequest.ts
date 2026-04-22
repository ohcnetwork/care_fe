import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { BODY_SITES, KNOWN_USERNAMES } from "tests/helper/commonConstants";
import {
  expectToast,
  selectFromCommand,
  selectFromDefinitionCategoryPicker,
  selectFromValueSet,
} from "tests/helper/ui";

export const STATUS_OPTIONS = [
  "Draft",
  "Active",
  "On Hold",
  "Entered in Error",
  "Ended",
  "Completed",
  "Revoked",
  "Unknown",
];

export const ACTIVITY_DEFINITIONS = [
  "Urinalysis",
  "Complete Blood Count (CBC) Panel",
  "Lipid Panel",
  "Fasting Blood Glucose",
];

export const PRIORITIES = ["Routine", "Urgent", "ASAP", "Stat"];

export interface ServiceRequestTestData {
  activityDefinition: string;
  priority: string;
  navigateCategories: string[];
  status: string;
  bodySite?: string;
  patientInstruction?: string;
  notes?: string;
  requestor?: string;
}

export function generateServiceRequestTestData(
  allFields: boolean = false,
): ServiceRequestTestData {
  const data: ServiceRequestTestData = {
    activityDefinition: faker.helpers.arrayElement(ACTIVITY_DEFINITIONS),
    priority: faker.helpers.arrayElement(PRIORITIES),
    navigateCategories: ["Lab Tests"],
    status: "Active",
  };

  if (allFields) {
    return {
      ...data,
      bodySite: faker.helpers.arrayElement(BODY_SITES),
      patientInstruction: `Instruction: ${faker.lorem.sentence()}`,
      notes: `Note: ${faker.lorem.sentence()}`,
      requestor: faker.helpers.arrayElement(KNOWN_USERNAMES),
    };
  }

  return data;
}

export async function createServiceRequest(
  page: Page,
  facilityId: string,
  patientId: string,
  encounterId: string,
  allFields: boolean = false,
): Promise<ServiceRequestTestData> {
  const data = generateServiceRequestTestData(allFields);

  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
  );

  await page.getByRole("button", { name: /create service request/i }).click();

  const activityDefinitionPicker = page
    .locator('button[role="combobox"]')
    .filter({ hasText: /select activity definition/i });
  await activityDefinitionPicker.waitFor({ state: "visible" });

  await selectFromDefinitionCategoryPicker(page, activityDefinitionPicker, {
    navigateCategories: data.navigateCategories,
    search: data.activityDefinition,
  });

  const serviceRequestCard = page
    .locator('[data-slot="collapsible"]')
    .filter({ hasText: data.activityDefinition })
    .first();
  await serviceRequestCard.waitFor({ state: "visible" });

  await serviceRequestCard.locator('[data-slot="collapsible-trigger"]').click();

  await serviceRequestCard
    .getByRole("radio", { name: /routine/i })
    .waitFor({ state: "visible" });

  await serviceRequestCard.getByRole("radio", { name: data.priority }).check();

  if (allFields) {
    const bodySiteSelector = serviceRequestCard
      .locator('button[role="combobox"]')
      .filter({ hasText: /body site/i });
    await bodySiteSelector.waitFor({ state: "visible" });

    await selectFromValueSet(page, bodySiteSelector, {
      search: data.bodySite!,
    });

    await serviceRequestCard
      .getByPlaceholder(/enter patient instruction/i)
      .fill(data.patientInstruction!);

    const requestorSelector = serviceRequestCard
      .locator('button[role="combobox"]')
      .filter({ has: page.locator("p") })
      .first();
    await requestorSelector.waitFor({ state: "visible" });

    await selectFromCommand(page, requestorSelector, {
      search: data.requestor!,
    });

    // Capture the selected requestor's display name after selection
    const selectedRequestorName = await serviceRequestCard
      .locator('button[role="combobox"]')
      .locator("p.font-medium.text-gray-900")
      .first()
      .textContent();
    data.requestor = selectedRequestorName?.trim() || data.requestor!;

    await serviceRequestCard.getByPlaceholder(/add note/i).fill(data.notes!);
  }

  await page.getByRole("button", { name: /submit/i }).click();

  await expectToast(page, /questionnaire submitted successfully/i);

  return data;
}
