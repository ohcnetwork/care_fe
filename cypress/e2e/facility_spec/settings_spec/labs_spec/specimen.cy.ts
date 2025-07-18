import { faker } from "@faker-js/faker";

import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

// Form field options
const SPECIMEN_STATUS = ["Active", "Draft", "Retired"] as const;
const SPECIMEN_TYPES = ["Air Sample", "Abscess", "Allograft"] as const;
const COLLECTION_METHODS = [
  "Finger stick",
  "Timed urine collection",
  "Aspiration - action",
] as const;
const PATIENT_PREPARATIONS = [
  "Day before procedure",
  "Fractionated dose",
  "Full strength dose",
] as const;
const TESTED_PREFERENCES = ["Preferred", "Alternate"] as const;
const CAP_COLORS = ["black", "red", "blue", "green"] as const;

// Test data generators
const generateUniqueSlug = () => faker.string.alphanumeric(8);

const generateMandatoryFields = () => ({
  title: faker.science.chemicalElement().name,
  slug: generateUniqueSlug(),
  description: faker.lorem.sentence(),
  status: faker.helpers.arrayElement(SPECIMEN_STATUS),
  typeCollected: faker.helpers.arrayElement(SPECIMEN_TYPES),
});

const generateTestData = () => ({
  default: {
    ...generateMandatoryFields(),
    derivedFromUri: faker.internet.url(),
    collection: faker.helpers.arrayElement(COLLECTION_METHODS),
    patientPreparation: faker.helpers.arrayElement(PATIENT_PREPARATIONS),
    testedPreference: faker.helpers.arrayElement(TESTED_PREFERENCES),
    retentionTime: faker.number.int({ min: 12, max: 48 }).toString(),
    requirement: faker.lorem.sentence(),
    containerDescription: faker.lorem.sentence(),
    cap: faker.helpers.arrayElement(CAP_COLORS),
    capacity: faker.number.int({ min: 5, max: 20 }).toString(),
    minimumVolume: faker.number.int({ min: 1, max: 10 }).toString(),
    preparation: faker.lorem.paragraph(),
  },
  mandatoryOnly: generateMandatoryFields(),
});

describe("Facility Specimen Management", () => {
  const facilityCreation = new FacilityCreation();

  beforeEach(() => {
    cy.loginByApi("facility_admin");
    cy.visit("/");
  });

  it("Verify the error messages for all fields in the specimen definition form", () => {
    facilityCreation.selectFirstRandomFacility();

    // Navigate to specimen definitions
    cy.url().then((url) => {
      const facilityId = url.split("/facility/")[1].split("/")[0];
      cy.visit(`/facility/${facilityId}/settings/specimen_definitions`);
    });

    // Attempt to save empty form and verify error messages
    cy.get("button").contains("Add Definition").click();
    cy.get("button").contains("Save").click();

    cy.verifyErrorMessages([
      { message: "Required", label: "Title" },
      { message: "Required", label: "Slug" },
      {
        message: "Required",
        label: "Description",
      },
      { message: "Required", label: "Type Collected" },
    ]);
  });

  it("Create specimen with mandatory fields and confirm deletion of specimen", () => {
    facilityCreation.selectFirstRandomFacility();

    // Generate test data with Active status
    const specimenData = {
      ...generateTestData().mandatoryOnly,
      status: "Active",
    };

    // Navigate to specimen definitions
    cy.url().then((url) => {
      const facilityId = url.split("/facility/")[1].split("/")[0];
      cy.visit(`/facility/${facilityId}/settings/specimen_definitions`);
    });

    // Create new specimen
    cy.get("button").contains("Add Definition").click();

    // Fill mandatory fields
    cy.typeIntoField('input[name="title"]', specimenData.title);
    cy.clearAndTypeIntoField('input[name="slug"]', specimenData.slug);
    cy.typeIntoField('textarea[name="description"]', specimenData.description);
    cy.clickAndSelectOptionV2("Status", specimenData.status);
    cy.typeAndSelectOptionV2("Type Collected", specimenData.typeCollected);

    // Save and verify creation
    cy.intercept("POST", "**/api/v1/facility/**/specimen_definition").as(
      "createSpecimen",
    );
    cy.get("button").contains("Save").click();
    cy.wait("@createSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen definition created");

    // Navigate to specimen details
    cy.typeIntoField(
      "input[placeholder='Search definitions']",
      specimenData.title,
    );
    cy.verifyContentPresence('[data-slot="table"]', [specimenData.title]);
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();

    // Delete specimen
    cy.get("button").contains("Delete").click();
    cy.intercept("PUT", "**/api/v1/facility/**/specimen_definition/**").as(
      "deleteSpecimen",
    );
    cy.get("button").contains("Confirm").click();
    cy.wait("@deleteSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen definition retired successfully");
  });

  it("Create specimen with all fields and verify edit functionality", () => {
    facilityCreation.selectFirstRandomFacility();

    // Generate test data with all fields
    const specimenData = generateTestData().default;

    // Navigate to specimen definitions
    cy.url().then((url) => {
      const facilityId = url.split("/facility/")[1].split("/")[0];
      cy.visit(`/facility/${facilityId}/settings/specimen_definitions`);
    });

    // Create new specimen with all fields
    cy.get("button").contains("Add Definition").click();

    // Fill all available fields
    cy.typeIntoField('input[name="title"]', specimenData.title);
    cy.clearAndTypeIntoField('input[name="slug"]', specimenData.slug);
    cy.typeIntoField('textarea[name="description"]', specimenData.description);
    cy.clickAndSelectOptionV2("Status", specimenData.status);
    cy.typeIntoField(
      'input[name="derived_from_uri"]',
      specimenData.derivedFromUri,
    );
    cy.typeAndSelectOptionV2("Type Collected", specimenData.typeCollected);
    cy.typeAndSelectOptionV2("Collection", specimenData.collection);
    cy.get("button").contains("Add").click();
    cy.typeAndSelectOptionV2(
      "Patient Preparation",
      specimenData.patientPreparation,
    );
    cy.clickAndSelectOptionV2("Preference", specimenData.testedPreference);
    cy.selectComboboxDropdown("Retention time", specimenData.retentionTime);
    cy.typeIntoField(
      'textarea[name="type_tested.requirement"]',
      specimenData.requirement,
    );
    cy.typeIntoField(
      'textarea[name="type_tested.container.description"]',
      specimenData.containerDescription,
    );
    cy.typeAndSelectOptionV2("Cap", specimenData.cap);
    cy.selectComboboxDropdown("Capacity", specimenData.capacity);
    cy.typeIntoField(
      'input[name="type_tested.container.minimum_volume.string"]',
      specimenData.minimumVolume,
    );
    cy.typeIntoField(
      'textarea[name="type_tested.container.preparation"]',
      specimenData.preparation,
    );

    // Save and verify creation
    cy.intercept("POST", "**/api/v1/facility/**/specimen_definition").as(
      "createSpecimen",
    );
    cy.get("button").contains("Save").click();
    cy.wait("@createSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen definition created");

    // Navigate to specimen details
    cy.typeIntoField(
      "input[placeholder='Search definitions']",
      specimenData.title,
    );
    cy.clickAndSelectOption("button:contains('Status')", specimenData.status);
    cy.verifyContentPresence('[data-slot="table"]', [specimenData.title]);
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();

    // Edit specimen
    cy.get("button").contains("Edit").click();

    // Generate updated test data
    const updatedTitle = faker.science.chemicalElement().name;
    const updatedDerivedFromUri = faker.internet.url();
    const updatedStatus = faker.helpers.arrayElement(SPECIMEN_STATUS);
    const updatedCap = faker.helpers.arrayElement(CAP_COLORS);
    const updatedSlug = generateUniqueSlug();
    const updatedDescription = faker.lorem.sentence();
    const updatedTypeCollected = faker.helpers.arrayElement(SPECIMEN_TYPES);

    // Update specimen fields
    cy.clearAndTypeIntoField('input[name="title"]', updatedTitle);
    cy.clearAndTypeIntoField('input[name="slug"]', updatedSlug);
    cy.clearAndTypeIntoField(
      'textarea[name="description"]',
      updatedDescription,
    );
    cy.clickAndSelectOptionV2("Status", updatedStatus);
    cy.clearAndTypeIntoField(
      'input[name="derived_from_uri"]',
      updatedDerivedFromUri,
    );
    cy.typeAndSelectOptionV2("Type Collected", updatedTypeCollected);
    cy.typeAndSelectOptionV2("Cap", updatedCap);

    // Save and verify update
    cy.intercept("PUT", "**/api/v1/facility/**/specimen_definition/**").as(
      "updateSpecimen",
    );
    cy.get("button").contains("Save").click();
    cy.wait("@updateSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen Definition updated");

    // Navigate to specimen list page
    cy.get("button").contains("Back").click();

    // Verify updated specimen details
    cy.typeIntoField("input[placeholder='Search definitions']", updatedTitle);
    cy.clickAndSelectOption("button:contains('Status')", updatedStatus);
    cy.verifyContentPresence('[data-slot="table"]', [updatedTitle]);
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();
    cy.verifyContentPresence('[data-slot="card"]', [
      updatedDescription,
      updatedStatus,
      updatedTypeCollected,
      updatedDerivedFromUri,
      updatedCap,
    ]);
  });

  it("Create specimen and verify status filter functionality", () => {
    facilityCreation.selectFirstRandomFacility();

    // Generate test data with mandatory fields only
    const specimenData = generateTestData().mandatoryOnly;

    // Navigate to specimen definitions
    cy.url().then((url) => {
      const facilityId = url.split("/facility/")[1].split("/")[0];
      cy.visit(`/facility/${facilityId}/settings/specimen_definitions`);
    });

    // Create new specimen definition
    cy.get("button").contains("Add Definition").click();

    // Fill mandatory fields
    cy.typeIntoField('input[name="title"]', specimenData.title);
    cy.clearAndTypeIntoField('input[name="slug"]', specimenData.slug);
    cy.typeIntoField('textarea[name="description"]', specimenData.description);
    cy.clickAndSelectOptionV2("Status", specimenData.status);
    cy.typeAndSelectOptionV2("Type Collected", specimenData.typeCollected);

    // Save and verify creation
    cy.intercept("POST", "**/api/v1/facility/**/specimen_definition").as(
      "createSpecimen",
    );
    cy.get("button").contains("Save").click();
    cy.wait("@createSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen definition created");

    // Test status filter functionality
    cy.typeIntoField(
      "input[placeholder='Search definitions']",
      specimenData.title,
    );
    cy.clickAndSelectOption("button:contains('Status')", specimenData.status);
    cy.verifyContentPresence('[data-slot="table"]', [specimenData.title]);

    // Verify specimen details
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();
    cy.verifyContentPresence('[data-slot="card"]', [
      specimenData.description,
      specimenData.status,
      specimenData.typeCollected,
    ]);
  });
});
