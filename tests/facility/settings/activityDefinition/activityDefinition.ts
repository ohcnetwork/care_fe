import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";

import {
  closeAnyOpenPopovers,
  expectToast,
  selectFromCategoryPicker,
  selectFromCommand,
  selectFromLocationMultiSelect,
  selectFromRequirements,
  selectFromValueSet,
} from "tests/helper/ui";
import { expectedSlug } from "tests/helper/utils";

export const RESOURCE_CATEGORY_SLUG = "lab-tests-activity_definition";

export const RESOURCE_CATEGORY_NAME = "Lab Tests";

export const ACTIVITY_DEFINITION_CODES = [
  "Fluoroscopic venography of left limb with contrast",
  "Post-exposure herpesvirus infection prophylaxis",
  "Percutaneous ligation of left atrial appendage",
  "Mepolizumab therapy",
  "Toilet and suture of wound",
  "Canakinumab therapy",
  "Urinary tract infection prophylaxis",
  "Anifrolumab therapy",
  "Open excision of left atrial appendage",
  "Voclosporin therapy",
];

export const BODY_SITES = [
  "Structure of product of conception of ectopic pregnancy",
  "Structure of left deltoid muscle",
  "Structure of right deltoid muscle",
  "Structure of right supraclavicular lymph node",
  "Structure of left supraclavicular lymph node",
  "Structure of colonic submucosa and/or colonic muscularis propria",
  "Structure of lymphatic vessel and/or small blood vessel",
  "Structure of neuroretinal rim of right optic disc",
  "Structure of neuroretinal rim of left optic disc",
  "Structure of epithelium of right lens",
];

export const SPECIMEN_DEFINITIONS = [
  "Urinalysis Specimen",
  "Lipid Panel Blood Specimen",
  "CBC Blood Specimen",
  "Blood Glucose Test Specimen",
];

export const OBSERVATION_REQUIREMENTS = [
  "Urinalysis Observation",
  "Lipid Panel Observation",
  "Complete Blood Count",
  "Fasting Blood Glucose",
];

export const LOCATIONS = ["Pharmacy", "Bio-Chemistry Lab"];

export const DIAGNOSTIC_REPORT_CODES = [
  "Acyclovir [Susceptibility]",
  "Amdinocillin [Susceptibility] by Serum bactericidal titer",
  "Cefoperazone [Susceptibility] by Minimum inhibitory concentration (MIC)",
  "DBG Ab [Presence] in Serum or Plasma from Blood product unit",
  "R wave duration in lead AVR",
  "Health informatics pioneer and the father of LOINC",
  "Health informatics pioneer and cofounder of LOINC",
  "Specimen care is maintained",
  "Team communication is maintained throughout care",
  "Demonstrates knowledge of the expected psychosocial responses to the procedure",
];

export const CHARGE_ITEM_CATEGORIES = ["Lab Tests"];

export const CHARGE_ITEM_DEFINITIONS = [
  "Urinalysis Test",
  "Lipid Panel Test",
  "Complete Blood Count (CBC) Test",
  "Fasting Blood Glucose Test",
];

export const HEALTHCARE_SERVICES = ["Pathology Lab"];

export const STATUS_OPTIONS = [
  "Active",
  "Draft",
  "Retired",
  "Unknown",
] as const;

export const CLASSIFICATION_OPTIONS = [
  "Laboratory",
  "Imaging",
  "Procedure",
  "Counselling",
  "Education",
] as const;

interface ActivityDefinitionData {
  title: string;
  slug: string;
  description: string;
  usage: string;
  status: string;
  classification: string;
  derivedFromUri?: string;
  resourceCategoryName: string;
  code: string;
  bodySite?: string;
  specimen?: string;
  observation?: string;
  chargeItemCategory?: string;
  chargeItem?: string;
  location?: string;
  diagnosticReportCode?: string;
  healthcareService?: string;
}

export function generateActivityDefinitionData(
  allFields: boolean = false,
): ActivityDefinitionData {
  const title = faker.commerce.productName();
  const data = {
    title,
    slug: expectedSlug(title),
    resourceCategoryName: RESOURCE_CATEGORY_NAME,
    description: faker.commerce.productDescription(),
    usage: faker.lorem.sentences(2),
    status: faker.helpers.arrayElement(STATUS_OPTIONS),
    classification: faker.helpers.arrayElement(CLASSIFICATION_OPTIONS),
    code: faker.helpers.arrayElement(ACTIVITY_DEFINITION_CODES),
  };

  if (allFields) {
    return {
      ...data,
      derivedFromUri: faker.internet.url(),
      bodySite: faker.helpers.arrayElement(BODY_SITES),
      specimen: faker.helpers.arrayElement(SPECIMEN_DEFINITIONS),
      observation: faker.helpers.arrayElement(OBSERVATION_REQUIREMENTS),
      chargeItemCategory: faker.helpers.arrayElement(CHARGE_ITEM_CATEGORIES),
      chargeItem: faker.helpers.arrayElement(CHARGE_ITEM_DEFINITIONS),
      location: faker.helpers.arrayElement(LOCATIONS),
      diagnosticReportCode: faker.helpers.arrayElement(DIAGNOSTIC_REPORT_CODES),
      healthcareService: faker.helpers.arrayElement(HEALTHCARE_SERVICES),
    };
  }

  return data;
}

/**
 * Helper function to create an Activity Definition via UI
 * @param page - Playwright page object
 * @param facilityId - Facility ID where the AD will be created
 * @param allFields - Whether to create the AD with all fields
 * @param overrides - Overrides for the AD data (status and classification)
 * @returns Object containing the created AD data
 */
export async function createActivityDefinition(
  page: Page,
  facilityId: string,
  allFields: boolean = false,
  overrides: Partial<
    Pick<ActivityDefinitionData, "status" | "classification">
  > = {},
): Promise<ActivityDefinitionData> {
  const data = { ...generateActivityDefinitionData(allFields), ...overrides };

  await page.goto(
    `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${RESOURCE_CATEGORY_SLUG}/new`,
  );

  await page.getByLabel(/title.*\*/i).fill(data.title);
  await expect(page.getByLabel(/slug/i)).toHaveValue(data.slug);

  await page.getByLabel(/description.*\*/i).fill(data.description);
  await page.getByLabel(/usage.*\*/i).fill(data.usage);

  await page.getByLabel(/^status$/i).click();
  await page.getByRole("option", { name: data.status }).click();

  await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
  await page
    .getByRole("option", {
      name: data.classification,
    })
    .click();

  await expect(page.getByText(RESOURCE_CATEGORY_NAME)).toBeVisible();

  await page.getByLabel(/^kind$/i).click();
  await page.getByRole("option", { name: /service request/i }).click();

  const codeCombobox = page.getByRole("combobox", { name: /^code/i });
  await selectFromValueSet(page, codeCombobox, {
    search: data.code,
  });

  if (allFields) {
    await page.getByLabel(/^derived from uri$/i).fill(data.derivedFromUri!);

    const bodySite = page.getByRole("combobox", { name: /body site/i });
    await selectFromValueSet(page, bodySite, {
      search: data.bodySite!,
    });

    const specimenTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select specimen requirements/i });
    await specimenTrigger.scrollIntoViewIfNeeded();
    await selectFromRequirements(page, specimenTrigger, {
      search: data.specimen!,
    });
    await closeAnyOpenPopovers(page);

    const obsTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select observation requirements/i });
    await selectFromRequirements(page, obsTrigger, {
      search: data.observation!,
    });
    await closeAnyOpenPopovers(page);

    const chargePicker = page
      .getByRole("combobox")
      .filter({ hasText: /select.*charge item/i });
    await selectFromCategoryPicker(page, chargePicker, {
      navigateCategories: [data.chargeItemCategory!],
      search: data.chargeItem!,
      closeAfterSelect: true,
    });

    const healthcareServiceTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select.*healthcare service/i });
    await selectFromCommand(page, healthcareServiceTrigger, {
      search: data.healthcareService!,
      itemIndex: 0,
    });

    const locationsTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select.*location/i });
    await selectFromLocationMultiSelect(page, locationsTrigger, {
      search: data.location!,
    });

    const diagCombobox = page
      .getByRole("combobox")
      .filter({ hasText: /search.*diagnostic/i });
    await selectFromValueSet(page, diagCombobox, {
      search: data.diagnosticReportCode!,
    });
  }

  await closeAnyOpenPopovers(page);
  await page.getByRole("button", { name: /^create$/i }).click();

  await expectToast(page, /activity definition created successfully/i);

  await expect(page).toHaveURL(
    `/facility/${facilityId}/settings/activity_definitions`,
  );

  return data;
}
