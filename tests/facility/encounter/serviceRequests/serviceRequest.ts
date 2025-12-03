import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { Priority } from "src/types/emr/serviceRequest/serviceRequest";
import { BODY_SITES, KNOWN_USERS } from "tests/helper/commonConstants";
import {
  expectToast,
  selectFromCommand,
  selectFromDefinitionCategoryPicker,
  selectFromValueSet,
} from "tests/helper/ui";

export const STATUS_OPTIONS = [
  "draft",
  "active",
  "on hold",
  "entered in error",
  "ended",
  "completed",
  "revoked",
  "unknown",
];

export const ACTIVITY_DEFINITIONS = [
  "Urinalysis",
  "Complete Blood Count (CBC) Panel",
  "Lipid Panel",
  "Fasting Blood Glucose",
];

export const PRIORITIES = Object.values(Priority);

export interface ServiceRequestTestData {
  activityDefinition: string;
  priority: Priority;
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
    status: "active",
  };

  if (allFields) {
    return {
      ...data,
      bodySite: faker.helpers.arrayElement(BODY_SITES),
      patientInstruction: faker.lorem.sentence(),
      notes: faker.lorem.sentence(),
      requestor: faker.helpers.arrayElement(KNOWN_USERS),
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
    itemIndex: 0,
  });

  const prioritySelector = page
    .locator('button[role="combobox"][data-slot="select-trigger"]')
    .filter({ hasText: /routine|urgent|asap|stat/i })
    .first();

  // Only change priority if it's different from the default
  const currentValue = await prioritySelector.textContent();
  if (!currentValue?.toLowerCase().includes(data.priority.toLowerCase())) {
    await prioritySelector.click();

    await page
      .getByRole("option")
      .filter({ hasText: new RegExp(data.priority, "i") })
      .first()
      .click();
  }

  if (allFields) {
    const bodySiteSelector = page
      .locator('button[role="combobox"]')
      .filter({ hasText: /body site/i });
    await bodySiteSelector.waitFor({ state: "visible" });

    await selectFromValueSet(page, bodySiteSelector, {
      search: data.bodySite!,
    });

    await page
      .getByPlaceholder(/enter patient instruction/i)
      .fill(data.patientInstruction!);

    const requestorSelector = page
      .locator('button[data-slot="popover-trigger"][role="combobox"]')
      .filter({ has: page.locator("p", { hasText: /admin/i }) })
      .first();
    await requestorSelector.waitFor({ state: "visible" });

    await selectFromCommand(page, requestorSelector, {
      search: data.requestor!,
    });

    await page.getByPlaceholder(/add note/i).fill(data.notes!);
  }

  await page.getByRole("button", { name: /add/i }).click();
  await page.getByRole("button", { name: /submit/i }).click();

  await expectToast(page, /questionnaire submitted successfully/i);

  return data;
}
