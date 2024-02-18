import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import PatientPredefined from "../../pageobject/Patient/PatientPredefined";
import ShiftCreation from "../../pageobject/Shift/ShiftCreation";
import FacilityLocation from "../../pageobject/Facility/FacilityLocation";

describe("Patient Consultation in multiple combination", () => {
  const patientConsultationPage = new PatientConsultationPage();
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientPredefined = new PatientPredefined();
  const shiftCreation = new ShiftCreation();
  const facilityLocation = new FacilityLocation();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Internal Transfer within facility Patient with Domicilary Care", () => {
    // Asymptomatic
    // Abnormal category
    // No ICD-11 error message then icd-11 add
    // add investigation
    // add review after and add action
    // add telemedicine
  });

  it("Referred From another Facility Patient with OP consultation", () => {
    patientPage.createPatient();
    patientPage.selectFacility("Dummy Facility 40");
    patientPredefined.createPatient();
    patientPage.patientformvisibility();
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    // referred from another facility patient
    patientConsultationPage.selectConsultationStatus(
      "Referred from another facility"
    );
    // verify the free text in referring facility name
    patientConsultationPage.typeReferringFacility("Life Care Hospital");
    // Vomiting and Nausea symptoms
    patientConsultationPage.selectSymptoms(["VOMITING", "SORE THROAT"]);
    patientConsultationPage.selectSymptomsDate("01012024");
    // Stable category
    patientConsultationPage.selectPatientCategory("Stable");
    // OP Consultation
    patientConsultationPage.selectPatientSuggestion("OP Consultation");
    // one ICD-11 and no principal
    patientConsultationPage.selectPatientDiagnosis(
      "1A04",
      "add-icd11-diagnosis-as-confirmed"
    );
    // no investigation
    patientConsultationPage.fillConsultationFieldById(
      "consultation_notes",
      "Patient General Instructions"
    );
    // no review after and no action
    patientConsultationPage.fillTreatingPhysican("Dev Doctor");
    patientConsultationPage.submitConsultation();
    cy.get(".pnotify-pre-line").should(
      "contain.text",
      "Patient discharged successfully"
    );
    // verify the Discharge Reason, Diagnosis, treatment physican
    patientConsultationPage.verifyTextInConsultation(
      "#consultation-buttons",
      "OP file closed"
    );
    patientConsultationPage.verifyTextInConsultation(
      "#treating-physician",
      "Dev Doctor"
    );
    patientConsultationPage.verifyTextInConsultation("#diagnoses-view", "1A04");
  });

  it("OP Patient with Refer to another hospital consultation", () => {
    patientPage.createPatient();
    patientPage.selectFacility("Dummy Facility 40");
    patientPredefined.createPatient();
    patientPage.patientformvisibility();
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    // Route of Facility - Out Patient
    patientConsultationPage.selectConsultationStatus(
      "Outpatient/Emergency Room"
    );
    // Select the Symptoms - Sore throat and fever symptoms
    patientConsultationPage.selectSymptoms(["FEVER", "SORE THROAT"]);
    patientConsultationPage.selectSymptomsDate("01012024");
    patientConsultationPage.fillConsultationFieldById(
      "history_of_present_illness",
      "Patient History"
    );
    patientConsultationPage.fillConsultationFieldById(
      "examination_details",
      "Patient Examination Details"
    );
    patientConsultationPage.fillConsultationFieldById("weight", "80");
    patientConsultationPage.fillConsultationFieldById("height", "170");
    // Comfort Care category
    patientConsultationPage.selectPatientCategory("Comfort Care");
    // Decision after consultation - Referred to Facility
    patientConsultationPage.selectPatientSuggestion(
      "Refer to another Hospital"
    );
    patientConsultationPage.selectPatientReferance(
      "Dummy Request Approving Center"
    );
    // Four ICD-11 and one principal diagnosis
    patientConsultationPage.selectPatientDiagnosis(
      "1A04",
      "add-icd11-diagnosis-as-confirmed"
    );
    patientConsultationPage.selectPatientPrincipalDiagnosis("1A04");
    // no investigation for the patient
    patientConsultationPage.fillConsultationFieldById(
      "treatment_plan",
      "Patient Treatment Plan"
    );
    patientConsultationPage.fillConsultationFieldById(
      "consultation_notes",
      "Patient General Instructions"
    );
    patientConsultationPage.fillConsultationFieldById(
      "special_instruction",
      "Special Instructions"
    );
    patientConsultationPage.fillTreatingPhysican("Dev Doctor");
    // no review after and no action
    patientConsultationPage.submitConsultation();
    // Create a shifting request
    shiftCreation.typeCurrentFacilityPerson("Current Facility Person");
    shiftCreation.typeCurrentFacilityPhone("9999999999");
    shiftCreation.typeShiftReason("reason for shift");
    shiftCreation.submitShiftForm();
    facilityLocation.verifyNotification("Shift request created successfully");
  });

  it("OP Patient with Declare Death", () => {
    // Asymptomatic
    // CRITICAL category
    // ICD-11 WITH PRINCIPAL
    // NO investigation
    // NO review after and NO action
  });

  it("OP Patient with admission consultation", () => {
    // icd 11 - 4 diagnosis with one principal
    patientPage.createPatient();
    patientPage.selectFacility("Dummy Facility 40");
    patientPredefined.createPatient();
    patientPage.patientformvisibility();
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    patientConsultationPage.fillIllnessHistory("history");
    patientConsultationPage.selectConsultationStatus(
      "Outpatient/Emergency Room"
    );
    patientConsultationPage.selectSymptoms("ASYMPTOMATIC");
    patientConsultationPage.fillExaminationDetails(
      "Patient Examination details"
    );

    patientConsultationPage.enterConsultationDetails(
      "Stable",
      "70",
      "170",
      "IP007",
      "generalnote",
      "Dev Doctor"
    );
    patientConsultationPage.submitConsultation();

    // Below code for the prescription module only present while creating a new consultation
    patientConsultationPage.clickAddPrescription();
    patientConsultationPage.interceptMediaBase();
    patientConsultationPage.selectMedicinebox();
    patientConsultationPage.waitForMediabaseStatusCode();
    patientConsultationPage.prescribefirstMedicine();
    patientConsultationPage.enterDosage("3");
    patientConsultationPage.selectDosageFrequency("Twice daily");
    patientConsultationPage.submitPrescriptionAndReturn();
  });

  it("Edit created consultation to existing patient", () => {
    // temporary fixing, whole file will be refactored soon
    cy.get("[data-cy='patient']").first().click();
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.fillIllnessHistory("editted");
    patientConsultationPage.updateSymptoms("FEVER");
    patientConsultationPage.setSymptomsDate("01082023");
    patientConsultationPage.updateConsultation();
    patientConsultationPage.verifySuccessNotification(
      "Consultation updated successfully"
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
