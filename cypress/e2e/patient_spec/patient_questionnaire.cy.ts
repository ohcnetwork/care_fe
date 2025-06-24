import { faker } from "@faker-js/faker";

import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientPrescription } from "@/pageObject/Patients/PatientPrescription";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generateRandomCharacter } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientPrescription = new PatientPrescription();

describe("All combination of encounter types", () => {
  beforeEach(() => {
    cy.loginByApi("superadmin");
    cy.visit("/");
  });

  it("Verify the non-supported questionnaire are not accessible in patient update", () => {
    // create a new questionnaire
    const slugName = faker.string.alphanumeric({ length: { min: 5, max: 10 } });
    const questionnaireName = faker.string.alpha({
      length: { min: 5, max: 10 },
    });
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
    cy.get("[data-slot='card-title']").contains("Properties").scrollIntoView();
    cy.clickRadioButton("Status", "active");
    cy.clickRadioButton("Subject Type", "patient");
    cy.clearAndTypeIntoField("input[name='title']", questionnaireName);
    cy.clearAndTypeIntoField("input[name='slug']", slugName);
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
    cy.get("[data-slot='avatar']").click();
    cy.get("[data-slot='dropdown-menu-item']").contains("Log Out").click();
    // Switch to a new doctor user
    cy.loginByApi("doctor");
    cy.visit("/");
    facilityCreation.selectFirstRandomFacility();
    cy.getFacilityIdAndNavigate("encounters/patients");
    cy.get("button").contains("View Encounter").first().click();
    cy.get("#patient-details").click();
    cy.get("[role='tablist']").contains("Updates").click();
    cy.get("a").contains("Add Patient Updates").click();
    cy.get("button").contains("Add Questionnaire").click();
    cy.typeAndSelectOption(
      "input[placeholder='Search Questionnaires']",
      questionnaireName,
      false,
    );
    cy.verifyContentPresence("[data-slot='card-content']", [
      "Allergy Intolerances cannot be recorded without an active encounter",
      "Medication requests cannot be recorded without an active encounter",
      "Medication statements cannot be recorded without an active encounter",
      "Symptoms cannot be recorded without an active encounter",
      "Diagnosis cannot be recorded without an active encounter",
      "Create an encounter first to upload files",
    ]);
  });

  it("Verify the allergy questionnaire are only accessible in encounter ", () => {
    // create a new questionnaire
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
    cy.get("[data-slot='card-title']").contains("Properties").scrollIntoView();
    cy.clickRadioButton("Status", "active");
    cy.clickRadioButton("Subject Type", "encounter");
    cy.clearAndTypeIntoField("input[name='title']", questionnaireName);
    cy.clearAndTypeIntoField("input[name='slug']", slugName);
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
    cy.get("[data-slot='avatar']").click();
    cy.get("[data-slot='dropdown-menu-item']").contains("Log Out").click();
    // Switch to a new doctor user
    cy.loginByApi("doctor");
    cy.visit("/");
    facilityCreation.selectFirstRandomFacility();
    cy.getFacilityIdAndNavigate("encounters/patients");
    cy.get("button").contains("View Encounter").first().click();
    cy.get("button").contains("Add Questionnaire").click();
    cy.typeAndSelectOption(
      "input[placeholder='Search Questionnaires']",
      questionnaireName,
      false,
    );
    // add allergy to the patient
    cy.get("button").contains("Allergy").click();
    cy.typeAndSelectOption(
      "input[placeholder='Type to search and select from the list']",
      allergyName,
      false,
    );
    cy.get("button").contains("Done").click();
    // submit the questionnaire
    cy.verifyAndClickElement("button[type='submit']", "Submit");
    cy.verifyNotification("Questionnaire submitted successfully");
    // verify the allergy is in overview page
    cy.verifyContentPresence("[data-slot='accordion']", [
      "Allergies",
      allergyName,
      "Active",
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
    const respiratorySupportValues = {
      "etco2-(mmhg)": "120",
    };
    facilityCreation.selectFirstRandomFacility();

    // Chain the methods instead of multiple separate calls
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickUpdateEncounter()
      .addQuestionnaire("Respiratory Support")
      .fillQuestionnaire(respiratorySupportValues);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyOverviewValues(
      Object.values(respiratorySupportValues),
    );
  });

  it("verify the 500 character limit in input field", () => {
    const characterMaxLimit = generateRandomCharacter({
      charLimit: 510,
    });
    facilityCreation.selectFirstRandomFacility();
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
    cy.verifyNotification("Failed to submit questionnaire");
    cy.verifyErrorMessages([
      { label: "Text", message: "Text too long. Max allowed size is 500" },
    ]);
  });
});
