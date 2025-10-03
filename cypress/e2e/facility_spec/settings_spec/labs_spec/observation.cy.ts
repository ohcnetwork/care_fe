import { faker } from "@faker-js/faker";

import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();

const OBSERVATION_CATEGORIES = [
  "Social History",
  "Vital Signs",
  "Imaging",
  "Laboratory",
  "Procedure",
  "Survey",
  "Exam",
  "Therapy",
  "Activity",
] as const;

const STATUS = ["Active", "Draft", "Retired"] as const;

const DATA_TYPES = [
  "Boolean",
  "Decimal",
  "Integer",
  "DateTime",
  "Time",
  "String",
] as const;

const LOINC_CODES = [
  "Acyclovir",
  "Cefoperazone",
  "DBG Ab",
  "R wave duration in lead AVR",
] as const;

const OBSERVATION_CODES = [
  "Cefoperazone",
  "Acyclovir",
  "Amdinocillin",
  "DBG Ab",
  "R wave duration in lead AVR",
] as const;

const BODY_SITES = [
  "right deltoid muscle",
  "left deltoid muscle",
  "right supraclavicular lymph node",
  "left supraclavicular lymph node",
] as const;

const METHODS = [
  "Fluoroscopic",
  "Image guided",
  "CT guided",
  "MRI",
  "automatic",
] as const;

const UNITS = [
  "percent",
  "percent of slope",
  "percent Abnormal",
  "percent Activity",
  "percent BasalActivity",
  "percent Binding",
  "percent Blockade",
] as const;

const generateUniqueSlug = () => faker.string.alphanumeric(8);

const generateObservationDefinitionFields = () => ({
  title: faker.lorem.words(3),
  slug: generateUniqueSlug(),
  description: faker.lorem.sentence(),
  category: faker.helpers.arrayElement(OBSERVATION_CATEGORIES),
  dataType: faker.helpers.arrayElement(DATA_TYPES),
  loincCode: faker.helpers.arrayElement(LOINC_CODES),
  status: faker.helpers.arrayElement(STATUS),
  bodySite: faker.helpers.arrayElement(BODY_SITES),
  method: faker.helpers.arrayElement(METHODS),
  unit: faker.helpers.arrayElement(UNITS),
  observationCode: faker.helpers.arrayElement(OBSERVATION_CODES),
});

describe("Observation basic workflow", () => {
  beforeEach(() => {
    cy.loginByApi("facility_admin");
    cy.visit("/");
  });

  it("Create observation definition with mandatory fields and verify filters", () => {
    facilityCreation.selectFirstRandomFacility();
    cy.getFacilityIdAndNavigate("settings/observation_definitions");
    cy.get("button").contains("Add Definition").click();
    const testData = generateObservationDefinitionFields();
    cy.typeIntoField('input[name="title"]', testData.title);
    cy.clearAndTypeIntoField('input[name="slug_value"]', testData.slug);
    cy.typeIntoField('textarea[name="description"]', testData.description);
    cy.clickAndSelectOptionV2("Category", testData.category);
    cy.clickAndSelectOptionV2("Data Type", testData.dataType);
    cy.clickAndSelectOptionV2("Status", testData.status);
    cy.typeAndSelectOptionV2("LOINC Code", testData.loincCode);
    cy.get("button").contains("Create").click();
    cy.verifyNotification("Observation definition created");

    // Verify by Status filter
    cy.clickAndSelectOption("button:contains('Status')", testData.status);
    cy.verifyContentPresence('[data-slot="table"]', [testData.title]);

    // Verify by Category filter
    cy.clickAndSelectOption("button:contains('Category')", testData.category);
    cy.typeIntoField("input[placeholder='Search definitions']", testData.title);
    cy.verifyContentPresence('[data-slot="table"]', [testData.title]);
  });

  it("Verify observation definition form validation", () => {
    facilityCreation.selectFirstRandomFacility();

    // Use the new command to navigate to specimen definitions
    cy.getFacilityIdAndNavigate("settings/observation_definitions");

    cy.get("button").contains("Add Definition").click();
    cy.get("button").contains("Create").click();

    cy.verifyErrorMessages([
      {
        label: "Title",
        message: "Required",
      },
      {
        label: "Slug",
        message: "Required",
      },
      {
        label: "Description",
        message: "Required",
      },
      {
        label: "Category",
        message: "Required",
      },
      {
        label: "Data Type",
        message: "Required",
      },
      {
        label: "LOINC Code",
        message: "Required",
      },
    ]);
  });

  it("Create observation definition with all fields and verify modification", () => {
    facilityCreation.selectFirstRandomFacility();
    cy.getFacilityIdAndNavigate("settings/observation_definitions");
    cy.get("button").contains("Add Definition").click();
    const testData = generateObservationDefinitionFields();
    cy.typeIntoField('input[name="title"]', testData.title);
    cy.clearAndTypeIntoField('input[name="slug"]', testData.slug);
    cy.typeIntoField('textarea[name="description"]', testData.description);
    cy.clickAndSelectOptionV2("Category", testData.category);
    cy.clickAndSelectOptionV2("Data Type", testData.dataType);
    cy.clickAndSelectOptionV2("Status", testData.status);
    cy.typeAndSelectOptionV2("LOINC Code", testData.loincCode);
    cy.typeAndSelectOptionV2("Body Site", testData.bodySite);
    cy.typeAndSelectOptionV2("Method", testData.method);
    cy.typeAndSelectOptionV2("Unit", testData.unit);
    cy.get("button").contains("Add your first component").click();
    cy.typeAndSelectOption(
      "button:contains('Search for observation codes')",
      testData.observationCode,
      false,
    );
    cy.clickAndSelectOption("button:contains('Quantity')", testData.dataType);
    cy.typeAndSelectOption(
      "button:contains('Search for units')",
      testData.unit,
      false,
    );
    cy.get("button").contains("Create").click();
    cy.verifyNotification("Observation definition created");

    // Filter by status before searching
    cy.clickAndSelectOption("button:contains('Status')", testData.status);
    cy.typeIntoField("input[placeholder='Search definitions']", testData.title);
    cy.verifyContentPresence('[data-slot="table"]', [testData.title]);
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();

    cy.verifyContentPresence('[data-slot="card"]', [
      testData.description,
      testData.loincCode,
      testData.bodySite,
      testData.method,
      testData.unit,
      testData.observationCode,
    ]);

    // Edit specimen
    cy.get("button").contains("Edit").click();

    // Update fields with new test data
    const updatedData = generateObservationDefinitionFields();
    cy.clearAndTypeIntoField('input[name="title"]', updatedData.title);
    cy.clearAndTypeIntoField(
      'textarea[name="description"]',
      updatedData.description,
    );
    cy.clickAndSelectOptionV2("Category", updatedData.category);
    cy.clickAndSelectOptionV2("Data Type", updatedData.dataType);
    cy.clickAndSelectOptionV2("Status", updatedData.status);
    cy.typeAndSelectOptionV2("Body Site", updatedData.bodySite);
    cy.typeAndSelectOptionV2("Method", updatedData.method);
    cy.typeAndSelectOptionV2("Unit", updatedData.unit);

    // Save the changes
    cy.get("button").contains("Save").click();
    cy.verifyNotification("Observation definition updated");

    // Filter by status before searching for the updated definition
    cy.get("button").contains("Back").click();
    cy.clickAndSelectOption("button:contains('Status')", updatedData.status);
    cy.typeIntoField(
      "input[placeholder='Search definitions']",
      updatedData.title,
    );
    cy.verifyContentPresence('[data-slot="table"]', [updatedData.title]);
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();

    // Verify updated content
    cy.verifyContentPresence('[data-slot="card"]', [
      updatedData.description,
      updatedData.bodySite,
      updatedData.method,
      updatedData.unit,
    ]);
  });
});
