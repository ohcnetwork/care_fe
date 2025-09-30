import { faker } from "@faker-js/faker";

import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientPrescription } from "@/pageObject/Patients/PatientPrescription";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generateRandomCharacter } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientPrescription = new PatientPrescription();

describe("All combination of questionnaire submissions", () => {
  beforeEach(() => {
    cy.loginByApi("superadmin");
    cy.visit("/");
  });

  it("Verify the allergy questionnaire are only accessible in encounter ", () => {
    // Create a questionnaire with encounter subject type for allergy testing
    const slugName = faker.string.alphanumeric({ length: { min: 5, max: 10 } });
    const questionnaireName = faker.string.alpha({
      length: { min: 5, max: 10 },
    });
    const allergyOptions = [
      "Fezolinetant",
      "Anifrolumab",
      "Live attenuated virus antigen",
      "Isomaltose",
      "Cetrimonium bromide",
      "Benzenesulfonic acid",
      "Inclisiran",
      "Purified water",
      "Olipudase alfa",
    ];
    const allergyName = faker.helpers.arrayElement(allergyOptions);

    // Navigate to admin dashboard and create questionnaire
    cy.get("a").contains("Admin Dashboard").click();
    cy.get("button").contains("Create Questionnaire").click();
    cy.get("button").contains("Import").click();
    cy.get("[data-slot='dropdown-menu-item']")
      .contains("Import from URL")
      .click();
    cy.typeIntoField(
      "input[placeholder='https://example.com/questionnaire.json']",
      "https://raw.githubusercontent.com/nihal467/questionnaire/refs/heads/main/All%20Structure%20Question.json",
    );
    cy.get("[data-slot='button']").contains("Import").click({ force: true });
    cy.get("[data-slot='button']").contains("Import Form").click();

    // Configure questionnaire properties for encounter subject type
    cy.get("[data-slot='card-title']").contains("Properties").scrollIntoView();
    cy.clickRadioButton("Status", "active");
    cy.clickRadioButton("Subject Type", "encounter"); // This makes it encounter-specific
    cy.clearAndTypeIntoField("input[name='title']", questionnaireName);
    cy.clearAndTypeIntoField("input[name='slug']", slugName);

    // Assign questionnaire to Doctor organization
    cy.get("label")
      .contains("Organizations")
      .parent()
      .within(() => {
        cy.get("button").contains("Select Organizations").click();
      });
    cy.get("[cmdk-input]").should("be.visible").type("Doctor");
    cy.get("[cmdk-item]").contains("Doctor").first().click();
    cy.get("body").type("{esc}");
    cy.get("button[type='submit']").scrollIntoView().click();

    // Logout and switch to doctor user to test encounter questionnaire
    cy.get("[data-slot='avatar']").click();
    cy.get("[data-slot='dropdown-menu-item']").contains("Log Out").click();

    // Test questionnaire access within an active encounter
    cy.loginByApi("doctor");
    cy.visit("/");
    facilityCreation.selectFirstRandomFacility();
    cy.getFacilityIdAndNavigate("encounters/patients");
    cy.intercept("GET", "**/api/v1/encounter/**").as("getEncounters");
    cy.get("button").contains("Filter").click();
    cy.get('[role="menuitem"]').contains("Status").click();
    cy.get("div").contains("In Progress").click();
    cy.get("body").type("{esc}");
    cy.wait("@getEncounters").its("response.statusCode").should("eq", 200);
    cy.get("button").contains("View Encounter").first().click();
    cy.get("button").contains("Update Details").click();
    cy.get("div[role='dialog']").within(() => {
      cy.get('[data-cy="add-questionnaire-button"]').click();
    });
    cy.typeAndSelectOption(
      "input[placeholder='Search Questionnaires']",
      questionnaireName,
      false,
    );

    // Add allergy information to the questionnaire
    cy.get("button").contains("Allergy").click();
    cy.get(
      "input[placeholder='Add Allergy'], input[placeholder='Add another Allergy']",
    ).then(($input) => {
      cy.wrap($input).type(allergyName);
      cy.get("[cmdk-item]").contains(allergyName).click();
    });
    cy.get("button").contains("Done").click();

    // Submit the questionnaire and verify success
    cy.verifyAndClickElement("button[type='submit']", "Submit");
    cy.verifyNotification("Questionnaire submitted successfully");

    // Verify the allergy information appears in the patient overview
    cy.verifyContentPresence("[data-slot='collapsible']", [
      "Allergies",
      allergyName,
      "Active",
    ]);
  });

  it("Verify the non-supported questionnaire are not accessible in patient update", () => {
    // Create a questionnaire with patient subject type to test restrictions
    const slugName = faker.string.alphanumeric({ length: { min: 5, max: 10 } });
    const questionnaireName = faker.string.alpha({
      length: { min: 5, max: 10 },
    });

    // Navigate to admin dashboard and create questionnaire
    cy.get("a").contains("Admin Dashboard").click();
    cy.get("button").contains("Create Questionnaire").click();
    cy.get("button").contains("Import").click();
    cy.get("[data-slot='dropdown-menu-item']")
      .contains("Import from URL")
      .click();
    cy.typeIntoField(
      "input[placeholder='https://example.com/questionnaire.json']",
      "https://raw.githubusercontent.com/nihal467/questionnaire/refs/heads/main/All%20Structure%20Question.json",
    );
    cy.get("[data-slot='button']").contains("Import").click({ force: true });
    cy.get("[data-slot='button']").contains("Import Form").click();

    // Configure questionnaire properties for patient subject type
    cy.get("[data-slot='card-title']").contains("Properties").scrollIntoView();
    cy.clickRadioButton("Status", "active");
    cy.clickRadioButton("Subject Type", "patient"); // This makes it patient-specific
    cy.clearAndTypeIntoField("input[name='title']", questionnaireName);
    cy.clearAndTypeIntoField("input[name='slug']", slugName);

    // Assign questionnaire to Doctor organization
    cy.get("label")
      .contains("Organizations")
      .parent()
      .within(() => {
        cy.get("button").contains("Select Organizations").click();
      });
    cy.get("[cmdk-input]").should("be.visible").type("Doctor");
    cy.get("[cmdk-item]").contains("Doctor").first().click();
    cy.get("body").type("{esc}");
    cy.get("button[type='submit']").scrollIntoView().click();

    // Logout and switch to doctor user to test questionnaire access
    cy.get("[data-slot='avatar']").click();
    cy.get("[data-slot='dropdown-menu-item']").contains("Log Out").click();

    // Test questionnaire access as doctor user
    cy.loginByApi("doctor");
    cy.visit("/");
    facilityCreation.selectFirstRandomFacility();
    cy.getFacilityIdAndNavigate("encounters/patients");
    cy.get("button").contains("View Encounter").first().click();
    cy.get("[data-slot='patient-info-hover-card-trigger']")
      .filter(":visible")
      .click();
    cy.get("a").contains("View Profile").click();
    cy.get("[role='tablist']").contains("Updates").click();
    cy.get("a").contains("Add Patient Updates").click();
    cy.get("button").contains("Add Questionnaire").click();
    cy.typeAndSelectOption(
      "input[placeholder='Search Questionnaires']",
      questionnaireName,
      false,
    );

    // Verify that patient-specific questionnaires show appropriate error messages
    // when accessed outside of an active encounter
    cy.verifyContentPresence("[data-slot='card-content']", [
      "Allergy Intolerances cannot be recorded without an active encounter",
      "Medication requests cannot be recorded without an active encounter",
      "Medication statements cannot be recorded without an active encounter",
      "Symptoms cannot be recorded without an active encounter",
      "Diagnosis cannot be recorded without an active encounter",
      "Create an encounter first to upload files",
    ]);
  });
});

describe("Patient Encounter Questionnaire", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("nurse");
    cy.visit("/");
  });

  it("Create a new ABG questionnaire and verify the values", () => {
    // Test data for respiratory support questionnaire
    const respiratorySupportValues = {
      "etco2-(mmhg)": "120",
    };
    facilityCreation.selectFirstRandomFacility();

    // Execute questionnaire workflow using page object methods
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickUpdateEncounter()
      .addQuestionnaire("Respiratory Support")
      .fillQuestionnaire(respiratorySupportValues);
    patientPrescription.submitQuestionnaire();

    // Verify the submitted values appear in the overview
    patientEncounter.verifyOverviewValues(
      Object.values(respiratorySupportValues),
    );
  });

  it("verify the 500 character limit in input field", () => {
    // Generate text exceeding the 500 character limit to test validation
    const characterMaxLimit = generateRandomCharacter({
      charLimit: 510, // Exceeds the 500 character limit
    });
    facilityCreation.selectFirstRandomFacility();

    // Attempt to submit questionnaire with oversized text
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickUpdateEncounter()
      .addQuestionnaire("Feedback Form")
      .fillQuestionnaire({
        "any-suggestions-for-improvement": characterMaxLimit,
      });
    patientPrescription.clickSubmitQuestionnaire();

    // Verify that submission fails with appropriate error message
    cy.verifyNotification("Failed to submit questionnaire");
    cy.verifyErrorMessages([
      { label: "Text", message: "Text too long. Max allowed size is 500" },
    ]);
  });
});
