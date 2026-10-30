import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";
import { BODY_SITES, KNOWN_USERNAMES } from "tests/helper/commonConstants";
import { submitAndExpectSuccess } from "tests/helper/questionnaire";
import { questionBlock } from "tests/helper/questionnaireV2";
import { selectFromCommand, selectFromValueSet } from "tests/helper/ui";

export const ACTIVITY_DEFINITIONS = [
  "Urinalysis",
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

export type ServiceRequestOverrides = Partial<
  Pick<ServiceRequestTestData, "activityDefinition" | "priority">
>;

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
  overrides: ServiceRequestOverrides = {},
): Promise<ServiceRequestTestData> {
  const data = { ...generateServiceRequestTestData(allFields), ...overrides };

  await page.goto(
    `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/service_requests`,
  );

  await page
    .getByRole("link", { name: "Create Service Request", exact: true })
    .click();

  const block = questionBlock(page, "Service Request");
  await expect(block).toHaveCount(1);
  await block
    .getByRole("combobox")
    .filter({ hasText: "Select Activity Definition" })
    .click();
  const picker = page.getByRole("dialog").filter({
    has: page.getByPlaceholder("Search activity definitions", { exact: true }),
  });
  await expect(picker).toBeVisible();
  for (const category of data.navigateCategories) {
    await picker.getByRole("option", { name: category, exact: true }).click();
  }
  await picker
    .getByPlaceholder("Search activity definitions", { exact: true })
    .fill(data.activityDefinition);
  await picker
    .getByRole("option")
    .filter({
      has: page.getByText(data.activityDefinition, { exact: true }),
    })
    .click();

  const serviceRequestCard = block
    .locator('[data-slot="collapsible"]')
    .filter({ hasText: data.activityDefinition });
  await serviceRequestCard.waitFor({ state: "visible" });

  await serviceRequestCard.locator('[data-slot="collapsible-trigger"]').click();

  await serviceRequestCard
    .getByRole("radio", { name: /routine/i })
    .waitFor({ state: "visible" });

  await serviceRequestCard.getByRole("radio", { name: data.priority }).check();

  if (allFields) {
    const bodySiteSelector = serviceRequestCard
      .locator("label")
      .filter({ hasText: /^Body Site$/ })
      .locator("..")
      .getByRole("combobox");
    await bodySiteSelector.waitFor({ state: "visible" });

    await selectFromValueSet(page, bodySiteSelector, {
      search: data.bodySite!,
    });

    await serviceRequestCard
      .getByPlaceholder(/enter patient instruction/i)
      .fill(data.patientInstruction!);

    const requestorSelector = serviceRequestCard
      .locator("label")
      .filter({ hasText: /^Requester$/ })
      .locator("..")
      .getByRole("combobox");
    await requestorSelector.waitFor({ state: "visible" });

    await selectFromCommand(page, requestorSelector, {
      search: data.requestor!,
    });

    // Capture the selected requestor's display name after selection
    const selectedRequestorName = await requestorSelector
      .locator("p")
      .textContent();
    data.requestor = selectedRequestorName?.trim() || data.requestor!;

    await serviceRequestCard.getByPlaceholder(/add note/i).fill(data.notes!);
  }

  // Service requests are authored on the v2 fill page — its primary action
  // is "Save Changes" (see fill/FillHeader.tsx).
  await submitAndExpectSuccess(page);

  return data;
}
