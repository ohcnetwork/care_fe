import { faker } from "@faker-js/faker";

import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import {
  FacilitySpecimen,
  SpecimenDefinitionData,
} from "@/pageObject/facility/Labs/FacilitySpecimen";

// Constants for specimen definition form fields
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

// Helper function to generate unique slug for specimen definitions
const generateUniqueSlug = () => faker.string.uuid();

// Generates mandatory fields required for specimen definition
const generateMandatoryFields = () => ({
  title: faker.science.chemicalElement().name,
  slug: generateUniqueSlug(),
  description: faker.lorem.sentence(),
  status: faker.helpers.arrayElement(SPECIMEN_STATUS),
  typeCollected: faker.helpers.arrayElement(SPECIMEN_TYPES),
});

// Generates complete test data including both mandatory and optional fields
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
  const facilitySpecimen = new FacilitySpecimen();

  beforeEach(() => {
    cy.loginByApi("facility_admin");
    cy.visit("/");
  });

  it("Create specimen with mandatory fields and confirm deletion of specimen", () => {
    facilityCreation.selectFirstRandomFacility();

    // Use mandatory fields data with fixed Active status
    const specimenData = {
      ...generateTestData().mandatoryOnly,
      status: "Active",
    };

    cy.url().then((url) => {
      const facilityId = url.split("/facility/")[1].split("/")[0];
      cy.visit(`/facility/${facilityId}/settings/specimen_definitions`);
    });

    cy.get("button").contains("Add Definition").click();

    facilitySpecimen.fillSpecimenDefinitionForm(specimenData);

    cy.intercept("POST", "**/api/v1/facility/**/specimen_definition").as(
      "createSpecimen",
    );
    cy.get("button").contains("Save").click();
    cy.wait("@createSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen definition created");

    cy.get("input[placeholder='Search definitions']").type(specimenData.title);
    cy.verifyContentPresenceV2("table", [specimenData.title]);
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();

    cy.clickButton("Delete");

    cy.intercept("PUT", "**/api/v1/facility/**/specimen_definition/**").as(
      "deleteSpecimen",
    );
    cy.get("button").contains("Confirm").click();
    cy.wait("@deleteSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen definition retired successfully");
  });

  it("Verify the error messages for all fields in the specimen definition form", () => {
    facilityCreation.selectFirstRandomFacility();

    cy.url().then((url) => {
      const facilityId = url.split("/facility/")[1].split("/")[0];
      cy.visit(`/facility/${facilityId}/settings/specimen_definitions`);
    });

    cy.get("button").contains("Add Definition").click();

    cy.clickButton("Save");

    cy.verifyErrorMessages([
      { message: "Title is required", label: "Title" },
      { message: "Slug is required", label: "Slug" },
      {
        message: "String must contain at least 1 character(s)",
        label: "Description",
      },
      { message: "Required", label: "Type Collected" },
    ]);
  });

  it("Create specimen and verify status filter functionality", () => {
    facilityCreation.selectFirstRandomFacility();

    const specimenData = generateTestData().mandatoryOnly;

    cy.url().then((url) => {
      const facilityId = url.split("/facility/")[1].split("/")[0];
      cy.visit(`/facility/${facilityId}/settings/specimen_definitions`);
    });

    cy.get("button").contains("Add Definition").click();
    facilitySpecimen.fillSpecimenDefinitionForm(specimenData);

    cy.intercept("POST", "**/api/v1/facility/**/specimen_definition").as(
      "createSpecimen",
    );
    cy.get("button").contains("Save").click();
    cy.wait("@createSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen definition created");

    // Test status filter
    cy.get("input[placeholder='Search definitions']").type(specimenData.title);
    cy.clickSelectTrigger("Status", specimenData.status);
    cy.verifyContentPresenceV2("table", [specimenData.title]);

    // Verify details
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();
    facilitySpecimen.verifySpecimenDetails(specimenData);
  });

  it("Create specimen and verify edit functionality", () => {
    facilityCreation.selectFirstRandomFacility();

    const specimenData = generateTestData().mandatoryOnly;

    cy.url().then((url) => {
      const facilityId = url.split("/facility/")[1].split("/")[0];
      cy.visit(`/facility/${facilityId}/settings/specimen_definitions`);
    });

    cy.get("button").contains("Add Definition").click();
    facilitySpecimen.fillSpecimenDefinitionForm(specimenData);

    cy.intercept("POST", "**/api/v1/facility/**/specimen_definition").as(
      "createSpecimen",
    );
    cy.get("button").contains("Save").click();
    cy.wait("@createSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen definition created");

    // Search for the created specimen
    cy.get("input[placeholder='Search definitions']").type(specimenData.title);
    cy.verifyContentPresenceV2("table", [specimenData.title]);
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();

    // Edit specimen
    cy.clickButton("Edit");

    // Update with new data
    const updatedData: Partial<SpecimenDefinitionData> = {
      title: faker.science.chemicalElement().name,
      derivedFromUri: faker.internet.url(),
      status: faker.helpers.arrayElement(SPECIMEN_STATUS),
      cap: faker.helpers.arrayElement(CAP_COLORS),
      slug: generateUniqueSlug(),
      description: faker.lorem.sentence(),
      typeCollected: faker.helpers.arrayElement(SPECIMEN_TYPES),
    };

    facilitySpecimen.fillSpecimenDefinitionForm(
      updatedData as SpecimenDefinitionData,
    );

    cy.intercept("PUT", "**/api/v1/facility/**/specimen_definition/**").as(
      "updateSpecimen",
    );
    cy.get("button").contains("Save").click();
    cy.wait("@updateSpecimen").its("response.statusCode").should("eq", 200);
    cy.verifyNotification("Specimen Definition updated");

    // Verify updated data
    cy.get("input[placeholder='Search definitions']").type(updatedData.title);
    cy.verifyContentPresenceV2("table", [updatedData.title]);
    cy.get('[data-slot="table-cell"]').contains("See Details").first().click();
    facilitySpecimen.verifySpecimenDetails(updatedData);
  });
});
