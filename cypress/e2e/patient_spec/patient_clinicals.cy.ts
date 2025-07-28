import { PatientEncounter } from "@/pageObject/Patients/PatientEncounter";
import { PatientPrescription } from "@/pageObject/Patients/PatientPrescription";
import { FacilityCreation } from "@/pageObject/facility/FacilityCreation";
import {
  getRandomAllergyCriticality,
  getRandomAllergyName,
  getRandomAllergyStatus,
  getRandomConditionName,
  getRandomConditionStatus,
  getRandomConditionVerification,
  getRandomSymptomSeverity,
} from "@/utils/clinicalData";
import { viewPort } from "@/utils/viewPort";

const facilityCreation = new FacilityCreation();
const patientEncounter = new PatientEncounter();
const patientPrescription = new PatientPrescription();

describe("Patient Encounter Allergies, Symptoms and Diagnosis", () => {
  beforeEach(() => {
    cy.viewport(viewPort.desktop1080p.width, viewPort.desktop1080p.height);
    cy.loginByApi("test");
    cy.visit("/");
    facilityCreation.selectFirstRandomFacility();
  });

  it("Create and edit an allergy and verify the changes", () => {
    const createAllergyDetails = {
      allergyName: getRandomAllergyName(),
      criticality: "Low",
      status: "Confirmed",
    };
    const updateAllergyDetails = {
      allergyName: createAllergyDetails.allergyName,
      criticality: getRandomAllergyCriticality(),
      status: getRandomAllergyStatus(),
    };
    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickAddAllergy()
      .addAllergy(createAllergyDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyAllergy(createAllergyDetails);
    // update the patient allergy
    patientEncounter.clickAddAllergy().updateAllergy(updateAllergyDetails);

    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyAllergy(updateAllergyDetails);

    patientEncounter
      .clickAddAllergy()
      .deleteAllergy(createAllergyDetails.allergyName);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyItemDelete(createAllergyDetails.allergyName);
  });

  it("Create and edit a symptom and verify the changes", () => {
    const createSymptomsDetails = {
      symptomName: getRandomConditionName(),
      severity: "Moderate",
      status: "Active",
      verification: "Confirmed",
    };

    const updateSymptomsDetails = {
      symptomName: createSymptomsDetails.symptomName,
      severity: getRandomSymptomSeverity(),
      status: getRandomConditionStatus(),
      verification: getRandomConditionVerification(),
    };

    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickAddSymptoms()
      .addSymptoms(createSymptomsDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifySymptom(createSymptomsDetails);

    // verify duplicate symptoms behavior
    patientEncounter
      .clickAddSymptoms()
      .verifyDuplicateSymptom(createSymptomsDetails.symptomName);

    patientEncounter.deleteSymptom(createSymptomsDetails.symptomName);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyItemDelete(createSymptomsDetails.symptomName);

    patientEncounter.clickAddSymptoms().addSymptoms(createSymptomsDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifySymptom(createSymptomsDetails);

    // update the patient symptom
    patientEncounter.clickAddSymptoms().updateSymptom(updateSymptomsDetails);

    patientPrescription.submitQuestionnaire();
    patientEncounter.verifySymptom(updateSymptomsDetails);

    patientEncounter
      .clickAddSymptoms()
      .deleteSymptom(createSymptomsDetails.symptomName);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyItemDelete(createSymptomsDetails.symptomName);
  });

  it("Create and edit a diagnosis and verify the changes", () => {
    const createDiagnosisDetails = {
      diagnosisName: getRandomConditionName(),
      verification: "Confirmed",
      status: "Active",
    };

    const updateDiagnosisDetails = {
      diagnosisName: createDiagnosisDetails.diagnosisName,
      verification: getRandomConditionVerification(),
      status: getRandomConditionStatus(),
    };

    patientEncounter
      .navigateToEncounters()
      .clickInProgressEncounterFilter()
      .openFirstEncounterDetails()
      .clickAddDiagnosis()
      .addDiagnosis(createDiagnosisDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyDiagnoses(createDiagnosisDetails);

    patientEncounter
      .clickAddDiagnosis()
      .verifyDuplicateDiagnosis(createDiagnosisDetails.diagnosisName);

    patientEncounter.deleteDiagnosis(createDiagnosisDetails.diagnosisName);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyItemDelete(createDiagnosisDetails.diagnosisName);

    patientEncounter.clickAddDiagnosis().addDiagnosis(createDiagnosisDetails);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyDiagnoses(createDiagnosisDetails);

    patientEncounter
      .clickAddDiagnosis()
      .updateDiagnosis(updateDiagnosisDetails);

    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyDiagnoses(updateDiagnosisDetails);

    patientEncounter
      .clickAddDiagnosis()
      .deleteDiagnosis(createDiagnosisDetails.diagnosisName);
    patientPrescription.submitQuestionnaire();
    patientEncounter.verifyItemDelete(createDiagnosisDetails.diagnosisName);
  });
});
