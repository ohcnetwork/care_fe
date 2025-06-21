import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientPrescription } from "@/pageObject/Patients/PatientPrescription";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import { generateRandomCharacter } from "@/utils/commonUtils";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientPrescription = new PatientPrescription();

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
