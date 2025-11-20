import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";

import {
  Classification,
  Status,
} from "src/types/emr/activityDefinition/activityDefinition";

import { closeAnyOpenPopovers, expectToast, selectFromValueSet } from "./ui";

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

export const LOCATIONS = ["Pharmacy", "Bal-Gandhi", "Bio-Chemistry Lab"];

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

export function generateActivityDefinitionData() {
  const status = faker.helpers.arrayElement(Object.values(Status));
  const classification = faker.helpers.arrayElement(
    Object.values(Classification),
  );
  return {
    title: `${faker.science.chemicalElement().name.slice(0, 16)}_${faker.string.uuid().slice(0, 8)}`,
    description: faker.lorem.sentence(),
    usage: faker.lorem.sentences(2),
    derivedFromUri: faker.internet.url(),
    status: status,
    classification: classification,
  };
}

/**
 * Generate expected slug from title based on the application's slug generation logic
 * @param title - The title to convert to a slug
 * @returns The expected slug value
 */
export function generateExpectedSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

interface CreateActivityDefinitionOptions {
  resourceCategoryName?: string;
  overrides?: Partial<{
    title: string;
    description: string;
    usage: string;
    status: Status;
    classification: Classification;
    derivedFromUri: string;
  }>;
}

interface CreatedActivityDefinition {
  title: string;
  description: string;
  usage: string;
  status: Status;
  classification: Classification;
  derivedFromUri: string;
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
  options: CreateActivityDefinitionOptions = {},
): Promise<CreatedActivityDefinition> {
  const resourceCategoryName = options.resourceCategoryName || "Lab Tests";

  // Generate test data with random values
  const testData = {
    title:
      options.overrides?.title ||
      `${faker.science.chemicalElement().name.slice(0, 16)}_${faker.string.uuid().slice(0, 8)}`,
    description: options.overrides?.description || faker.lorem.sentence(),
    usage: options.overrides?.usage || faker.lorem.sentences(2),
    status:
      options.overrides?.status ||
      faker.helpers.arrayElement(Object.values(Status)),
    classification:
      options.overrides?.classification ||
      faker.helpers.arrayElement(Object.values(Classification)),
    derivedFromUri: options.overrides?.derivedFromUri || faker.internet.url(),
  };

  await page.goto(`/facility/${facilityId}/settings/activity_definitions`);
  await page.getByText(resourceCategoryName).click();

  await page.getByRole("button", { name: /add activity definition/i }).click();

  await page.getByLabel(/title.*\*/i).fill(testData.title);
  await page.getByLabel(/description.*\*/i).fill(testData.description);
  await page.getByLabel(/usage.*\*/i).fill(testData.usage);

  await page.getByLabel(/^status$/i).click();
  await page
    .getByRole("option", { name: new RegExp(testData.status, "i") })
    .click();

  await page.getByRole("combobox", { name: /^category\s*\*$/i }).click();
  await page
    .getByRole("option", {
      name: new RegExp(testData.classification.replace(/_/g, "\\s"), "i"),
    })
    .click();

  await page.getByLabel(/^kind$/i).click();
  await page.getByRole("option", { name: /service request/i }).click();

  const codeCombobox = page.getByRole("combobox", { name: /^code/i });
  await selectFromValueSet(page, codeCombobox, {
    itemIndex: 0,
  });

  await closeAnyOpenPopovers(page);
  await page.getByRole("button", { name: /^create$/i }).click();

  await expectToast(page, /activity definition created successfully/i);

  return {
    title: testData.title,
    description: testData.description,
    usage: testData.usage,
    status: testData.status,
    classification: testData.classification,
    derivedFromUri: testData.derivedFromUri,
  };
}
