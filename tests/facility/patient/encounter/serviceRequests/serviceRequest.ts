import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import { BODY_SITES, KNOWN_USERNAMES } from "tests/helper/commonConstants";
import { submitAndExpectSuccess } from "tests/helper/questionnaire";
import {
  selectFromCommand,
  selectFromDefinitionCategoryPicker,
  selectFromValueSet,
} from "tests/helper/ui";

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

  await page.getByRole("button", { name: /create service request/i }).click();

  const activityDefinitionPicker = page
    .locator('button[role="combobox"]')
    .filter({ hasText: /select activity definition/i });
  await activityDefinitionPicker.waitFor({ state: "visible" });

  await selectFromDefinitionCategoryPicker(page, activityDefinitionPicker, {
    navigateCategories: data.navigateCategories,
    search: data.activityDefinition,
  });

  // `StructuredList` renders one shared tree per row — a desktop grid row
  // AND a mobile collapsible card — rather than the legacy widget's one
  // `Collapsible` per row (`[data-slot="collapsible"]`). Every row carries
  // `data-structured-row`; the row's title (here, the activity definition's
  // display name) still lands somewhere in that row's DOM even when the
  // desktop grid is what's actually visible, so filtering by it still
  // resolves the right row. Each field is then reached through the column's
  // stable `data-column` anchor rather than a structural selector, so a
  // future column reflow can't silently misdirect these locators.
  const serviceRequestRow = page
    .locator('[role="row"][data-structured-row]')
    .filter({ hasText: data.activityDefinition })
    .first();
  await serviceRequestRow.waitFor({ state: "visible" });

  // Priority is a `Select` (normalized alongside every other column's
  // control), not the legacy `RadioGroup` — same underlying value, a
  // different, more compact control.
  const priorityTrigger = serviceRequestRow
    .locator('[data-column="priority"]')
    .getByRole("combobox");
  await priorityTrigger.waitFor({ state: "visible" });
  await priorityTrigger.click();
  // Not `exact: true` — matches the legacy radio-group lookup's own
  // case-insensitive behavior. `PRIORITIES`'s "Stat" fixture value only
  // ever matches the rendered option ("STAT", `t("stat")`) case-insensitively.
  await page.getByRole("option", { name: data.priority }).click();

  if (allFields) {
    const bodySiteSelector = serviceRequestRow
      .locator('[data-column="body_site"]')
      .getByRole("combobox");
    await bodySiteSelector.waitFor({ state: "visible" });

    await selectFromValueSet(page, bodySiteSelector, {
      search: data.bodySite!,
    });

    await serviceRequestRow
      .locator('[data-column="patient_instruction"]')
      .getByPlaceholder(/enter patient instruction/i)
      .fill(data.patientInstruction!);

    const requestorSelector = serviceRequestRow
      .locator('[data-column="requester"]')
      .getByRole("combobox");
    await requestorSelector.waitFor({ state: "visible" });

    await selectFromCommand(page, requestorSelector, {
      search: data.requestor!,
    });

    // Capture the selected requestor's display name after selection
    const selectedRequestorName = await serviceRequestRow
      .locator('[data-column="requester"]')
      .locator("p.font-medium.text-gray-900")
      .first()
      .textContent();
    data.requestor = selectedRequestorName?.trim() || data.requestor!;

    await serviceRequestRow
      .locator('[data-column="note"]')
      .getByPlaceholder(/add note/i)
      .fill(data.notes!);
  }

  // Service requests are authored on the v2 fill page — its primary action
  // is "Save Changes" (see fill/FillHeader.tsx).
  await submitAndExpectSuccess(page);

  return data;
}
