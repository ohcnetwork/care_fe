import { faker } from "@faker-js/faker";
import { expect, type Page } from "@playwright/test";

import { BODY_SITES } from "tests/helper/commonConstants";
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

export const ACTIVITY_DEFINITION_MAPPING = {
  Urinalysis: {
    slug: "urinalysis",
    title: "Urinalysis",
    specimens: [
      {
        title: "Urinalysis Specimen",
        typeCollected: "Urine",
        collectionMethod: "Urine specimen collection, clean catch",
        patientPreparation: ["Same day but before procedure"],
        container: {
          cap: "yellow cap",
          capacity: { value: 100, unit: "milliliter" },
          minVolume: { value: 30, unit: "milliliter" },
          preparation:
            "Label container. Ensure tight seal to avoid contamination or leakage.",
        },
        retention: { value: 2, unit: "hours" },
      },
    ],
    observations: [
      {
        title: "Urinalysis Observation",
        code: {
          code: "LP7681-2",
          system: "http://loinc.org",
          display: "Urine",
        },
        category: "laboratory",
        dataType: "choice",
        method: "Urine dipstick test",
      },
    ],
    diagnosticReports: ["Urine"],
    chargeItems: [
      {
        title: "Urinalysis Test",
        basePrice: 500,
        discounts: [
          { code: "oldage", display: "Old Age Discount", factor: 10 },
        ],
        taxes: [
          { code: "cgst", display: "CGST", factor: 3 },
          { code: "igst", display: "IGST", factor: 6 },
          { code: "gst", display: "GST", factor: 6 },
        ],
      },
    ],
    locations: ["Bio-Chemistry Lab"],
  },
  "Lipid Panel": {
    slug: "lipid_panel",
    title: "Lipid Panel",
    specimens: [
      {
        title: "Lipid Panel Blood Specimen",
        typeCollected: "Blood venous",
        collectionMethod: "Puncture - action",
        patientPreparation: ["After fasting"],
        container: {
          cap: "dark yellow cap",
          capacity: { value: 5, unit: "milliliter" },
          minVolume: { value: 2, unit: "milliliter" },
          preparation:
            "Invert tube gently 5-6 times. Let stand upright for clotting. Centrifuge within 1 hour of collection.",
        },
        retention: { value: 7, unit: "days" },
      },
    ],
    observations: [
      {
        title: "Lipid Panel Observation",
        code: {
          code: "LP97557-0",
          system: "http://loinc.org",
          display: "Lipid panel with direct LDL",
        },
        category: "laboratory",
        dataType: "quantity",
        qualifiedRanges: [
          { max: 200, interpretation: "Desirable" },
          { min: 200, max: 239, interpretation: "Borderline High" },
          { min: 239, interpretation: "High" },
        ],
      },
    ],
    diagnosticReports: ["Lipid panel with direct LDL"],
    chargeItems: [
      {
        title: "Lipid Panel Test",
        basePrice: 400,
        discounts: [
          { code: "oldage", display: "Old Age Discount", factor: 10 },
        ],
        taxes: [
          { code: "igst", display: "IGST", factor: 6 },
          { code: "gst", display: "GST", factor: 6 },
        ],
      },
    ],
    locations: ["Bio-Chemistry Lab"],
  },
  "Complete Blood Count (CBC) Panel": {
    slug: "complete_blood_count",
    title: "Complete Blood Count (CBC) Panel",
    specimens: [
      {
        title: "CBC Blood Specimen",
        typeCollected: "Blood venous",
        collectionMethod: "Puncture - action",
        patientPreparation: [],
        container: {
          cap: "lavender cap",
          capacity: { value: 10, unit: "milliliter" },
          minVolume: { value: 3, unit: "milliliter" },
          preparation:
            "Invert gently 8-10 times immediately after collection to mix with anticoagulant.",
        },
        retention: { value: 6, unit: "hours" },
      },
    ],
    observations: [
      {
        title: "Complete Blood Count",
        code: {
          code: "58410-2",
          system: "http://loinc.org",
          display: "CBC panel - Blood by Automated count",
        },
        category: "laboratory",
        dataType: "quantity",
        method: "Automated count",
        unit: {
          code: "g/dL",
          system: "http://unitsofmeasure.org",
          display: "gram per deciliter",
        },
        components: [
          {
            code: "LP32067-8",
            display: "Hemoglobin",
            unit: "g/dL",
            ranges: [
              { max: 12, interpretation: "Low" },
              { min: 12, max: 16, interpretation: "Normal" },
              { min: 16, interpretation: "High" },
            ],
          },
          {
            code: "LP15101-6",
            display: "Hematocrit",
            unit: "%",
            ranges: [
              { max: 36, interpretation: "Low" },
              { min: 36, max: 48, interpretation: "Normal" },
              { min: 48, interpretation: "High" },
            ],
          },
          {
            code: "LA12896-9",
            display: "Erythrocytes",
            unit: "10*6/uL",
            ranges: [
              { max: 4, interpretation: "Low" },
              { min: 4, max: 6, interpretation: "Normal" },
              { min: 6, interpretation: "High" },
            ],
          },
          {
            code: "LP7631-7",
            display: "Platelets",
            unit: "10*3/uL",
            ranges: [
              { max: 150, interpretation: "Low" },
              { min: 150, max: 450, interpretation: "Normal" },
              { min: 450, interpretation: "High" },
            ],
          },
        ],
      },
    ],
    diagnosticReports: ["CBC panel - Blood by Automated count"],
    chargeItems: [
      {
        title: "Complete Blood Count (CBC) Test",
        basePrice: 450,
        discounts: [
          { code: "child", display: "Child Discount", factor: 5 },
          { code: "oldage", display: "Old Age Discount", factor: 10 },
        ],
        taxes: [
          { code: "igst", display: "IGST", factor: 6 },
          { code: "gst", display: "GST", factor: 6 },
        ],
      },
    ],
    locations: ["Bio-Chemistry Lab"],
  },
  "Fasting Blood Glucose": {
    slug: "fasting_glucose",
    title: "Fasting Blood Glucose",
    specimens: [
      {
        title: "Blood Glucose Test Specimen",
        typeCollected: "Blood venous",
        collectionMethod: "Puncture - action",
        patientPreparation: ["After fasting"],
        container: {
          cap: "grey cap",
          capacity: { value: 5, unit: "milliliter" },
          minVolume: { value: 2, unit: "milliliter" },
          preparation:
            "Label tube immediately after collection. Invert gently 8-10 times to mix anticoagulant. Transport to lab under cold conditions (2-8°C) if processing is delayed.",
        },
        retention: { value: 24, unit: "hours" },
      },
    ],
    observations: [
      {
        title: "Fasting Blood Glucose",
        code: {
          code: "1558-6",
          system: "http://loinc.org",
          display: "Fasting glucose [Mass/volume] in Serum or Plasma",
        },
        category: "laboratory",
        dataType: "quantity",
        qualifiedRanges: [
          { max: 70, interpretation: "Low" },
          { min: 70, max: 99, interpretation: "Normal" },
          { min: 100, interpretation: "High" },
        ],
      },
    ],
    diagnosticReports: ["Fasting glucose [Mass/volume] in Serum or Plasma"],
    chargeItems: [
      {
        title: "Fasting Blood Glucose Test",
        basePrice: 600,
        discounts: [
          { code: "oldage", display: "Old Age Discount", factor: 10 },
        ],
        taxes: [
          { code: "igst", display: "IGST", factor: 6 },
          { code: "gst", display: "GST", factor: 6 },
        ],
      },
    ],
    locations: ["Bio-Chemistry Lab"],
  },
} as const;

export const STATUS_OPTIONS = [
  "Active",
  "Draft",
  "Retired",
  "Unknown",
] as const;

export const CLASSIFICATION_OPTIONS = [
  "Laboratory",
  "Imaging",
  "Surgical Procedure",
  "Counselling",
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
