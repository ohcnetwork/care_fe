import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientPrescription } from "@/pageObject/Patients/PatientPrescription";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import {
  generateRandomCharacter,
  getRandomAllergyCriticality,
  getRandomAllergyStatus,
  getRandomConditionName,
  getRandomConditionStatus,
  getRandomDiagnosisVerification,
  getRandomSymptomSeverity,
} from "@/utils/commonUtils";
import { getRandomAllergyName } from "@/utils/commonUtils";
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

describe("Patient Encounter Allergies, Symptoms and Diagnosis", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("Create and edit an allergy and verify the changes", () => {
    facilityCreation.selectFirstRandomFacility();
    const createAllergyDetails = {
      allergyName: getRandomAllergyName(),
      criticality: "Low",
      status: "Confirmed",
    };
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickAddAllergy()
      .addAllergy(createAllergyDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyAllergy(createAllergyDetails);

    const updateAllergyDetails = {
      allergyName: createAllergyDetails.allergyName,
      criticality: getRandomAllergyCriticality(),
      status: getRandomAllergyStatus(),
      notes: "Edit allergy notes",
    };

    patientEncounter.clickEditAllergy().updateAllergy(updateAllergyDetails);

    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyAllergy(updateAllergyDetails);

    patientEncounter.clickEditAllergy().deleteAllergy();
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyAllergyDelete(createAllergyDetails.allergyName);
  });

  it("Create and edit a symptom and verify the changes", () => {
    facilityCreation.selectFirstRandomFacility();
    const createSymptomsDetails = {
      symptomName: getRandomConditionName(),
      severity: "Moderate",
      status: "Active",
    };
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickAddSymptoms()
      .addSymptoms(createSymptomsDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifySymptom(createSymptomsDetails);

    const updateSymptomsDetails = {
      symptomName: createSymptomsDetails.symptomName,
      severity: getRandomSymptomSeverity(),
      status: getRandomConditionStatus(),
      notes: "Edit symptom notes",
    };

    patientEncounter.clickEditSymptoms().updateSymptom(updateSymptomsDetails);

    patientPrescription.submitQuestionnaire();
    patientEncounter.verifySymptom(updateSymptomsDetails);

    patientEncounter.clickEditSymptoms().deleteSymptom();
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifySymptomDelete(createSymptomsDetails.symptomName);
  });

  it("Create and edit a diagnosis and verify the changes", () => {
    facilityCreation.selectFirstRandomFacility();
    const createDiagnosisDetails = {
      diagnosisName: getRandomConditionName(),
      verification: "Confirmed",
      status: "Active",
    };
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickAddDiagnosis()
      .addDiagnosis(createDiagnosisDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyDiagnoses(createDiagnosisDetails);

    const updateDiagnosisDetails = {
      diagnosisName: createDiagnosisDetails.diagnosisName,
      verification: getRandomDiagnosisVerification(),
      status: getRandomConditionStatus(),
      notes: "Edit diagnosis notes",
    };

    patientEncounter
      .clickEditDiagnosis()
      .updateDiagnosis(updateDiagnosisDetails);

    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyDiagnoses(updateDiagnosisDetails);

    patientEncounter.clickEditDiagnosis().deleteDiagnosis();
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyDiagnosisDelete(
      createDiagnosisDetails.diagnosisName,
    );
  });
});
