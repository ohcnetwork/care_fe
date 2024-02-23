import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import PatientPredefined from "../../pageobject/Patient/PatientPredefined";
import ShiftCreation from "../../pageobject/Shift/ShiftCreation";
import PatientInvestigation from "../../pageobject/Patient/PatientInvestigation";
import PatientTreatmentPlan from "../../pageobject/Patient/PatientTreatmentPlan";
import PatientDeathReport from "../../pageobject/Patient/PatientDeathReport";
import PatientPrescription from "../../pageobject/Patient/PatientPrescription";

describe("Patient Consultation in multiple combination", () => {
  const patientConsultationPage = new PatientConsultationPage();
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientPredefined = new PatientPredefined();
  const shiftCreation = new ShiftCreation();
  const patientInvestigation = new PatientInvestigation();
  const patientTreatmentPlan = new PatientTreatmentPlan();
  const patientDeathReport = new PatientDeathReport();
  const patientPrescription = new PatientPrescription();
  const facilityName = "Dummy Facility 40";
  const doctorName = "Dev Doctor";

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("OP Patient with admission consultation", () => {
    // icd 11 - 4 diagnosis with one principal
    patientPage.createPatient();
    patientPage.selectFacility(facilityName);
    patientPredefined.createPatient();
    patientPage.patientformvisibility();
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    patientConsultationPage.selectConsultationStatus(
      "Outpatient/Emergency Room"
    );
    patientConsultationPage.selectSymptoms("ASYMPTOMATIC");

    cy.submitButton("Create Consultation");

    // Below code for the prescription module only present while creating a new consultation
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMediaBase();
    patientPrescription.selectMedicinebox();
    patientPrescription.waitForMediabaseStatusCode();
    patientPrescription.prescribefirstMedicine();
    patientPrescription.enterDosage("3");
    patientPrescription.selectDosageFrequency("Twice daily");
    patientPrescription.submitPrescriptionAndReturn();
  });

  it("OP Patient with Declare Death", () => {
    patientPage.createPatient();
    patientPage.selectFacility(facilityName);
    patientPredefined.createPatient();
    patientPage.patientformvisibility();
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    // OP Patient
    patientConsultationPage.selectConsultationStatus(
      "Outpatient/Emergency Room"
    );
    // Asymptomatic
    patientConsultationPage.selectSymptoms("ASYMPTOMATIC");
    // CRITICAL category
    patientConsultationPage.selectPatientCategory("Critical");
    patientConsultationPage.selectPatientSuggestion("Declare Death");
    patientConsultationPage.typeCauseOfDeath("Cause of Death");
    patientConsultationPage.typePatientConsultationDate(
      "#death_datetime",
      "2024-02-22T12:45"
    );
    patientConsultationPage.typeDeathConfirmedBy(doctorName);
    patientConsultationPage.typePatientConsultationDate(
      "#encounter_date",
      "2024-02-22T12:30"
    );
    cy.submitButton("Create Consultation");
    cy.verifyNotification(
      "Create Diagnoses - Atleast one diagnosis is required"
    );
    patientConsultationPage.selectPatientDiagnosis(
      "1A04",
      "add-icd11-diagnosis-as-confirmed"
    );
    cy.submitButton("Create Consultation");
    cy.verifyNotification("Consultation created successfully");
    // verify the data and death report
    patientConsultationPage.verifyTextInConsultation(
      "#consultation-buttons",
      "EXPIRED"
    );
    patientConsultationPage.clickPatientDetails();
    patientDeathReport.clickDeathReport();
    patientDeathReport.verifyDeathReportAutofill(
      "#name",
      "Patient With Predefined Data"
    );
    patientDeathReport.verifyDeathReportAutofill(
      "#cause_of_death",
      "Cause of Death"
    );
    cy.submitButton("Preview");
    cy.preventPrint();
    patientDeathReport.clickPrintDeathReport();
    cy.get("@verifyPrevent").should("be.called");
  });

  it("Internal Transfer within facility Patient with Domicilary Care", () => {
    patientPage.createPatient();
    patientPage.selectFacility(facilityName);
    patientPredefined.createPatient();
    patientPage.patientformvisibility();
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    // Internal Transfer within facility
    patientConsultationPage.selectConsultationStatus(
      "Internal Transfer within the facility"
    );
    patientConsultationPage.selectPatientWard("Dummy Location 1");
    // Asymptomatic
    patientConsultationPage.selectSymptoms("ASYMPTOMATIC");
    // Abnormal category
    patientConsultationPage.selectPatientCategory("Abnormal");
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    // one ICD-11 diagnosis
    patientConsultationPage.selectPatientDiagnosis(
      "1A04",
      "add-icd11-diagnosis-as-confirmed"
    );
    patientConsultationPage.typePatientConsultationDate(
      "#icu_admission_date",
      "2024-02-23T12:30"
    );
    // add investigation
    patientInvestigation.clickAddInvestigation();
    patientInvestigation.selectInvestigation("Vitals (GROUP)");
    patientInvestigation.clickInvestigationCheckbox();
    patientInvestigation.selectInvestigationFrequency("6");
    // Add advice and treating physican
    patientTreatmentPlan.typePatientGeneralInstruction(
      "Patient General Instructions"
    );
    patientTreatmentPlan.fillTreatingPhysican(doctorName);
    // add review after and add action
    patientTreatmentPlan.selectReviewAfter("15 mins");
    patientTreatmentPlan.selectAction("Specialist Required");
    // add telemedicine
    patientTreatmentPlan.clickTelemedicineCheckbox();
    patientTreatmentPlan.assignTelemedicineDoctor(doctorName);
    cy.submitButton("Create Consultation");
    cy.verifyNotification("Consultation created successfully");
    // verify the data reflection -
    patientConsultationPage.verifyTextInConsultation(
      "#patient-infobadges",
      "Specialist Required"
    );
    patientConsultationPage.verifyTextInConsultation(
      "#patient-infobadges",
      "Domiciliary Care"
    );
    patientConsultationPage.verifyTextInConsultation("#diagnoses-view", "1A04");
    patientInvestigation.clickInvestigationTab();
    patientConsultationPage.verifyTextInConsultation(
      "#investigation-suggestions",
      "Vitals"
    );
  });

  it("Referred From another Facility Patient with OP consultation", () => {
    patientPage.createPatient();
    patientPage.selectFacility(facilityName);
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
    patientTreatmentPlan.typePatientGeneralInstruction(
      "Patient General Instructions"
    );
    // no review after and no action
    patientTreatmentPlan.fillTreatingPhysican(doctorName);
    cy.submitButton("Create Consultation");
    cy.verifyNotification("Patient discharged successfully");
    // verify the Discharge Reason, Diagnosis, treatment physican
    patientConsultationPage.verifyTextInConsultation(
      "#consultation-buttons",
      "OP file closed"
    );
    patientConsultationPage.verifyTextInConsultation(
      "#treating-physician",
      doctorName
    );
    patientConsultationPage.verifyTextInConsultation("#diagnoses-view", "1A04");
  });

  it("OP Patient with Refer to another hospital consultation", () => {
    patientPage.createPatient();
    patientPage.selectFacility(facilityName);
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
    patientTreatmentPlan.typePatientGeneralInstruction(
      "Patient General Instructions"
    );
    patientTreatmentPlan.fillTreatingPhysican(doctorName);
    // no review after and no action
    cy.submitButton("Create Consultation");
    // Create a shifting request
    shiftCreation.typeCurrentFacilityPerson("Current Facility Person");
    shiftCreation.typeCurrentFacilityPhone("9999999999");
    shiftCreation.typeShiftReason("reason for shift");
    cy.submitButton("Submit");
    cy.verifyNotification("Shift request created successfully");
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
