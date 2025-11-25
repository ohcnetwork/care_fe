import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";

import {
  closeAnyOpenPopovers,
  expectToast,
  selectFromCategoryPicker,
  selectFromLocationMultiSelect,
  selectFromRequirements,
  selectFromValueSet,
} from "./ui";
import { expectedSlug } from "tests/helpers/utils";

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

export const STATUS_OPTIONS = ["Active", "Draft", "Retired", "Unknown"];

export const CLASSIFICATION_OPTIONS = [
  "Laboratory",
  "Imaging",
  "Surgical Procedure",
  "Counselling",
];

export function generateActivityDefinitionData() {
  const status = faker.helpers.arrayElement(STATUS_OPTIONS);
  const classification = faker.helpers.arrayElement(CLASSIFICATION_OPTIONS);
  return {
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    usage: faker.lorem.sentences(2),
    derivedFromUri: faker.internet.url(),
    status: status,
    classification: classification,
  };
}


interface CreatedActivityDefinition {
  title: string;
  slug: string;
  description: string;
  usage: string;
  status: string;
  classification: string;
  derivedFromUri: string;
  resourceCategoryName: string;
  code: string;
  bodySite?: string;
  specimen?: string;
  observation?: string;
  chargeItemCategory?: string;
  chargeItem?: string;
  location?: string;
  diagnosticReportCode?: string;
}

/**
 * Helper function to create an Activity Definition via UI with required fields only
 * @param page - Playwright page object
 * @param facilityId - Facility ID where the AD will be created
 * @param options - Optional overrides for default values
 * @returns Object containing the created AD data
 */
export async function createActivityDefinition(
  page: Page,
  facilityId: string,
  allFields: boolean = false,
  options: Partial<CreatedActivityDefinition> = {},
): Promise<CreatedActivityDefinition> {
  let title = faker.commerce.productName();
  let description = faker.commerce.productDescription();
  let usage = faker.lorem.sentences(2);
  let status = faker.helpers.arrayElement(STATUS_OPTIONS);
  let classification = faker.helpers.arrayElement(CLASSIFICATION_OPTIONS);
  let derivedFromUri = faker.internet.url();

  // Additional fields for allFields mode
  let selectedCode = faker.helpers.arrayElement(ACTIVITY_DEFINITION_CODES);
  let selectedBodySite = faker.helpers.arrayElement(BODY_SITES);
  let selectedSpecimen = faker.helpers.arrayElement(SPECIMEN_DEFINITIONS);
  let selectedObservation = faker.helpers.arrayElement(OBSERVATION_REQUIREMENTS);
  let selectedCategory = faker.helpers.arrayElement(CHARGE_ITEM_CATEGORIES);
  let selectedChargeItem = faker.helpers.arrayElement(CHARGE_ITEM_DEFINITIONS);
  let selectedLocation = faker.helpers.arrayElement(LOCATIONS);
  let selectedDiagCode = faker.helpers.arrayElement(DIAGNOSTIC_REPORT_CODES);

  await page.goto(
    `/facility/${facilityId}/settings/activity_definitions/categories/f-${facilityId}-${RESOURCE_CATEGORY_SLUG}`,
  );

  await page.getByRole("button", { name: /add activity definition/i }).click();

  await page.getByLabel(/title.*\*/i).fill(title);
  await page.getByLabel(/description.*\*/i).fill(description);
  await page.getByLabel(/usage.*\*/i).fill(usage);

  await page.getByLabel(/^status$/i).click();
  await page.getByRole("option", { name: status }).click();

  await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
  await page
    .getByRole("option", {
      name: classification,
    })
    .click();

  await expect(page.getByText(RESOURCE_CATEGORY_NAME)).toBeVisible();

  await page.getByLabel(/^kind$/i).click();
  await page.getByRole("option", { name: /service request/i }).click();

  const codeCombobox = page.getByRole("combobox", { name: /^code/i });
  await selectFromValueSet(page, codeCombobox, {
    search: selectedCode,
  });

  if (allFields) {
    await page.getByLabel(/^derived from uri$/i).fill(derivedFromUri);

    const bodySite = page.getByRole("combobox", { name: /body site/i });
    await selectFromValueSet(page, bodySite, {
      search: selectedBodySite,
    });

    // Specimen Requirements - directly target the button by its text
    const specimenTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select specimen requirements/i });
    await specimenTrigger.scrollIntoViewIfNeeded();
    await selectFromRequirements(page, specimenTrigger, {
      search: selectedSpecimen,
    });
    await closeAnyOpenPopovers(page);

    // Observation Requirements - directly target the button by its text
    const obsTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select observation requirements/i });
    await selectFromRequirements(page, obsTrigger, {
      search: selectedObservation,
    });
    await closeAnyOpenPopovers(page);

    // Charge Item Definitions - directly target the button by its text
    const chargePicker = page
      .getByRole("combobox")
      .filter({ hasText: /select.*charge item/i });
    await selectFromCategoryPicker(page, chargePicker, {
      navigateCategories: [selectedCategory],
      search: selectedChargeItem,
      closeAfterSelect: true,
    });

    const locationsTrigger = page
      .getByRole("combobox")
      .filter({ hasText: /select.*location/i });
    await selectFromLocationMultiSelect(page, locationsTrigger, {
      search: selectedLocation,
    });

    const diagCombobox = page
      .getByRole("combobox")
      .filter({ hasText: /search.*diagnostic/i });
    await selectFromValueSet(page, diagCombobox, {
      search: selectedDiagCode,
    });
  }

  await closeAnyOpenPopovers(page);
  await page.getByRole("button", { name: /^create$/i }).click();

  await expectToast(page, /activity definition created successfully/i);

  await expect(page).toHaveURL(
    `/facility/${facilityId}/settings/activity_definitions`,
  );

  const result: CreatedActivityDefinition = {
    title: title,
    slug: expectedSlug(title),
    description: description,
    usage: usage,
    status: status,
    classification: classification,
    derivedFromUri: derivedFromUri,
    resourceCategoryName: RESOURCE_CATEGORY_NAME,
    code: selectedCode,
  };

  if (allFields) {
    result.bodySite = selectedBodySite;
    result.specimen = selectedSpecimen;
    result.observation = selectedObservation;
    result.chargeItemCategory = selectedCategory;
    result.chargeItem = selectedChargeItem;
    result.location = selectedLocation;
    result.diagnosticReportCode = selectedDiagCode;
  }

  return result;
}
