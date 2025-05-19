import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { Questionnaire } from "@/pageObject/dashboard/Questionnaire";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const questionnaire = new Questionnaire();

describe("Operation on Questionnaire", () => {
  beforeEach(() => {
    cy.loginByApi("superadmin");
    cy.visit("/");
  });

  it("verify questionnaire status functionality in encounter", () => {
    const questionnaireName = "Respiratory Support";

    // Step 1: Navigate to a random facility and open an in-progress encounter
    facilityCreation.selectFirstRandomFacility();
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickUpdateEncounter();

    // Save the encounter URL for later use
    cy.saveCurrentUrl().as("patientEncounterUrl");

    // Add the questionnaire to the encounter
    patientEncounter.addQuestionnaire(questionnaireName);

    // Step 2: Update questionnaire status to retired in admin dashboard
    cy.visit("/");
    questionnaire
      .clickAdminDashboard()
      .searchQuestionnaire(questionnaireName)
      .clickFirstQuestionnaireView();

    // Save the questionnaire URL for later use
    cy.saveCurrentUrl().as("questionnaireUrl");

    questionnaire
      .clickRetiredStatus()
      .saveQuestionnaire()
      .verifyQuestionnaireUpdate();

    // Step 3: Verify questionnaire is not visible in encounter when retired
    cy.get<string>("@patientEncounterUrl").then((url) => {
      cy.visit(url);
    });
    questionnaire.verifyQuestionnaireNotPresent(questionnaireName);

    // Step 4: Update questionnaire status to draft in admin dashboard
    cy.get<string>("@questionnaireUrl").then((url) => {
      cy.visit(url);
    });
    questionnaire
      .clickDraftStatus()
      .saveQuestionnaire()
      .verifyQuestionnaireUpdate();

    // Step 5: Verify questionnaire is not visible in encounter when in draft
    cy.get<string>("@patientEncounterUrl").then((url) => {
      cy.visit(url);
    });
    questionnaire.verifyQuestionnaireNotPresent(questionnaireName);

    // Step 6: Update questionnaire status to active
    cy.get<string>("@questionnaireUrl").then((url) => {
      cy.visit(url);
    });
    questionnaire
      .clickActiveStatus()
      .saveQuestionnaire()
      .verifyQuestionnaireUpdate();

    // Step 7: Verify questionnaire is visible and can be added to encounter when active
    cy.get<string>("@patientEncounterUrl").then((url) => {
      cy.visit(url);
    });
    patientEncounter.addQuestionnaire(questionnaireName);
  });
});
