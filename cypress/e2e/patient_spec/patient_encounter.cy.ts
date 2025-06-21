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

  it("Create a new encounter and add the master questionnaire", () => {
    facilityCreation.selectFirstRandomFacility();
    cy.getFacilityIdAndNavigate("/encounters/patients");
    cy.get("button").contains("View Encounter").first().click();
  });

  it("Upload a new master questionnaire and keep it active", () => {
    const slugName = faker.string.alphanumeric({ length: { min: 5, max: 10 } });
    cy.get("a").contains("Admin Dashboard").click();
    cy.get("button").contains("Create Questionnaire").click();
    cy.get("button").contains("Import").click();
    cy.get("[data-slot='dropdown-menu-item']")
      .contains("Import from URL")
      .click();
    cy.typeIntoField(
      "input[placeholder='https://example.com/questionnaire.json']",
      "https://raw.githubusercontent.com/nihal467/questionnaire/refs/heads/main/master-questionnaire.json",
    );
    cy.get("[data-slot='button']").contains("Import").click({ force: true });
    cy.get("[data-slot='button']").contains("Import Form").click();
    cy.get("[data-slot='card-title']").contains("Properties").scrollIntoView();
    cy.clickRadioButton("Status", "active");
    cy.clickRadioButton("Subject Type", "encounter");
    cy.clearAndTypeIntoField("input[name='slug']", slugName);
    cy.get("label")
      .contains("Organizations")
      .parent()
      .within(() => {
        cy.get("button").contains("Select Organizations").click();
      });
    cy.get("[cmdk-input]").should("be.visible").type("Administrator");
    cy.get("[cmdk-item]").contains("Administrator").first().click();
    cy.get("body").type("{esc}");
    cy.get("button[type='submit']").scrollIntoView().click();
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
});
