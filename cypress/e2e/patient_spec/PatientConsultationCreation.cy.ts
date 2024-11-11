import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import PatientDeathReport from "../../pageobject/Patient/PatientDeathReport";
import PatientInvestigation from "../../pageobject/Patient/PatientInvestigation";
import PatientPredefined from "../../pageobject/Patient/PatientPredefined";
import PatientPrescription from "../../pageobject/Patient/PatientPrescription";
import PatientTreatmentPlan from "../../pageobject/Patient/PatientTreatmentPlan";
import ShiftCreation from "../../pageobject/Shift/ShiftCreation";

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
  const diagnosis1 = "1A00";
  const diagnosis2 = "1A01";
  const diagnosis3 = "1A02";
  const diagnosis4 = "1A04";
  const diagnosis5 = "1A05";
  const patientIllnessHistory = "History Of present illness";
  const patientExaminationHistory =
    "Examination Details and Clinical Conditions";
  const patientTreatment = "Treatment Plan";
  const generalInstruction = "Patient General Instructions";
  const specialInstruction = "Special Instruction";
  const procedureName = "Procedure No 1";
  const patientWeight = "70";
  const patientHeight = "170";
  const medicineOne = "DOLOLUP";
  const patientIpNumber = `${Math.floor(Math.random() * 90 + 10)}/${Math.floor(Math.random() * 9000 + 1000)}`;

  before(() => {
    loginPage.loginAsDistrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("OP Patient with admission consultation", () => {
    patientPage.createPatient();
    patientPage.selectFacility(facilityName);
    patientPredefined.createPatient();
    patientPage.patientformvisibility();
    patientPage.clickCreatePatient();
    patientPage.verifyPatientIsCreated();
    patientConsultationPage.selectConsultationStatus(
      "Outpatient/Emergency Room",
    );
    cy.get("#is_asymptomatic").click();
    patientConsultationPage.typePatientIllnessHistory(patientIllnessHistory);
    patientConsultationPage.typePatientExaminationHistory(
      patientExaminationHistory,
    );
    patientConsultationPage.typePatientWeight(patientWeight);
    patientConsultationPage.typePatientHeight(patientHeight);
    patientConsultationPage.selectPatientCategory("Mild");
    // icd 11 - 4 diagnosis with one principal
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis1,
      "add-icd11-diagnosis-as-unconfirmed",
    );
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis2,
      "add-icd11-diagnosis-as-provisional",
    );
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis3,
      "add-icd11-diagnosis-as-differential",
    );
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis4,
      "add-icd11-diagnosis-as-confirmed",
    );
    patientConsultationPage.selectPatientPrincipalDiagnosis(diagnosis4);
    patientTreatmentPlan.clickAddProcedure();
    patientTreatmentPlan.typeProcedureName(procedureName);
    patientTreatmentPlan.typeProcedureTime("220220241230");
    patientTreatmentPlan.typeTreatmentPlan(patientTreatment);
    patientTreatmentPlan.typePatientGeneralInstruction(generalInstruction);
    patientTreatmentPlan.typeSpecialInstruction(specialInstruction);
    patientTreatmentPlan.fillTreatingPhysican(doctorName);
    cy.submitButton("Create Consultation");
    // the above submit should fail as IP number is missing
    patientConsultationPage.typePatientNumber(patientIpNumber);
    patientConsultationPage.selectBed("Dummy Bed 6");
    cy.submitButton("Create Consultation");
    cy.verifyNotification("Consultation created successfully");
    // Below code for the prescription module only present while creating a new consultation
    patientPrescription.clickAddPrescription();
    patientPrescription.interceptMedibase();
    patientPrescription.selectMedicinebox();
    patientPrescription.selectMedicine(medicineOne);
    patientPrescription.enterDosage("3");
    patientPrescription.selectDosageFrequency("Twice daily");
    cy.submitButton("Submit");
    cy.wait(2000);
    cy.verifyNotification("Medicine prescribed");
    patientPrescription.clickReturnToDashboard();
    // Verify the data's across the dashboard
    patientConsultationPage.verifyTextInConsultation(
      "#patient-consultationbadges",
      patientIpNumber,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#diagnoses-view",
      diagnosis1,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#diagnoses-view",
      diagnosis2,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#diagnoses-view",
      diagnosis3,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#diagnoses-view",
      diagnosis4,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#history-presentillness",
      patientIllnessHistory,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#examination-details",
      patientExaminationHistory,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#treatment-summary",
      patientTreatment,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#general-instructions",
      generalInstruction,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#consultation-notes",
      specialInstruction,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#consultation-procedure",
      procedureName,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#patient-weight",
      patientWeight,
    );
    patientConsultationPage.verifyTextInConsultation(
      "#patient-height",
      patientHeight,
    );
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
      "Outpatient/Emergency Room",
    );
    // Asymptomatic
    cy.get("#is_asymptomatic").click();
    // CRITICAL category
    patientConsultationPage.selectPatientCategory("Critical");
    patientConsultationPage.selectPatientSuggestion("Declare Death");
    patientConsultationPage.typeCauseOfDeath("Cause of Death");
    patientConsultationPage.typePatientConsultationDate(
      "#death_datetime",
      "220220241230",
    );
    patientConsultationPage.typeDeathConfirmedBy(doctorName);
    patientConsultationPage.typePatientConsultationDate(
      "#encounter_date",
      "220220241230",
    );
    cy.submitButton("Create Consultation");
    cy.verifyNotification(
      "Create Diagnoses - Atleast one diagnosis is required",
    );
    cy.closeNotification();
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis4,
      "add-icd11-diagnosis-as-confirmed",
    );
    cy.submitButton("Create Consultation");
    cy.verifyNotification("Consultation created successfully");
    // verify the data and death report
    patientConsultationPage.verifyTextInConsultation(
      "#consultation-buttons",
      "EXPIRED",
    );
    patientConsultationPage.clickPatientDetails();
    patientDeathReport.clickDeathReport();
    patientDeathReport.verifyDeathReportAutofill(
      "#name",
      "Patient With Predefined Data",
    );
    patientDeathReport.verifyDeathReportAutofill(
      "#cause_of_death",
      "Cause of Death",
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
      "Internal Transfer within the facility",
    );
    patientConsultationPage.selectPatientWard("Dummy Location 1");
    // Asymptomatic
    cy.get("#is_asymptomatic").click();
    // Abnormal category
    patientConsultationPage.selectPatientCategory("Moderate");
    patientConsultationPage.selectPatientSuggestion("Domiciliary Care");
    // one ICD-11 diagnosis
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis4,
      "add-icd11-diagnosis-as-confirmed",
    );
    patientConsultationPage.typePatientConsultationDate(
      "#icu_admission_date",
      "230220241230",
    );
    // add investigation
    patientInvestigation.clickAddInvestigation();
    patientInvestigation.selectInvestigation("Vitals (GROUP)");
    patientInvestigation.clickInvestigationCheckbox();
    patientInvestigation.selectInvestigationFrequency("6");
    // Add advice and treating physican
    patientTreatmentPlan.typePatientGeneralInstruction(generalInstruction);
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
      "Specialist Required",
    );
    patientConsultationPage.verifyTextInConsultation(
      "#patient-infobadges",
      "Domiciliary Care",
    );
    patientConsultationPage.verifyTextInConsultation("#diagnoses-view", "1A04");
    patientInvestigation.clickInvestigationTab();
    patientConsultationPage.verifyTextInConsultation(
      "#investigation-suggestions",
      "Vitals",
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
      "Referred from another facility",
    );
    // verify the free text in referring facility name
    patientConsultationPage.typeReferringFacility("Life Care Hospital");
    patientConsultationPage.selectSymptomsDate("01012024");
    patientConsultationPage.typeAndMultiSelectSymptoms("s", [
      "Sore throat",
      "Sputum",
    ]);
    patientConsultationPage.clickAddSymptom();
    // Stable category
    patientConsultationPage.selectPatientCategory("Mild");
    // OP Consultation
    patientConsultationPage.selectPatientSuggestion("OP Consultation");
    // one ICD-11 and no principal
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis4,
      "add-icd11-diagnosis-as-confirmed",
    );
    // no investigation
    patientTreatmentPlan.typePatientGeneralInstruction(generalInstruction);
    // no review after and no action
    patientTreatmentPlan.fillTreatingPhysican(doctorName);
    cy.submitButton("Create Consultation");
    cy.verifyNotification("Patient discharged successfully");
    // verify the Discharge Reason, Diagnosis, treatment physican
    patientConsultationPage.verifyTextInConsultation(
      "#consultation-buttons",
      "OP file closed",
    );
    patientConsultationPage.verifyTextInConsultation(
      "#treating-physician",
      doctorName,
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
      "Outpatient/Emergency Room",
    );
    // Select the Symptoms - Breathlessness and Bleeding symptoms
    patientConsultationPage.selectSymptomsDate("01012024");
    patientConsultationPage.typeAndMultiSelectSymptoms("b", [
      "Breathlessness",
      "Bleeding",
    ]);
    patientConsultationPage.clickAddSymptom();
    // Mild category
    patientConsultationPage.selectPatientCategory("Mild");
    // Date of symptoms
    // Decision after consultation - Referred to Facility
    patientConsultationPage.selectPatientSuggestion(
      "Refer to another Hospital",
    );
    patientConsultationPage.selectPatientReferance(
      "Dummy Request Approving Center",
    );
    // Four ICD-11 and one principal diagnosis
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis4,
      "add-icd11-diagnosis-as-confirmed",
    );
    patientConsultationPage.selectPatientPrincipalDiagnosis(diagnosis4);
    // no investigation for the patient
    patientTreatmentPlan.typePatientGeneralInstruction(generalInstruction);
    patientTreatmentPlan.fillTreatingPhysican(doctorName);
    // no review after and no action
    cy.submitButton("Create Consultation");
    // Create a shifting request
    cy.closeNotification();
    shiftCreation.typeCurrentFacilityPerson("Current Facility Person");
    shiftCreation.typeCurrentFacilityPhone("9999999999");
    shiftCreation.typeShiftReason("reason for shift");
    cy.submitButton("Submit");
    cy.verifyNotification("Shift request created successfully");
  });

  it("Edit created consultation to existing patient", () => {
    patientPage.visitPatient("Dummy Patient 13");
    patientConsultationPage.clickEditConsultationButton();
    patientConsultationPage.typePatientIllnessHistory("editted");
    patientConsultationPage.selectPatientDiagnosis(
      diagnosis5,
      "add-icd11-diagnosis-as-unconfirmed",
    );
    cy.get("#diagnosis-entry-1").within(() => {
      cy.get("#condition-verification-status-menu").click();
      cy.get("#add-icd11-diagnosis-as-entered-in-error").click();
    });
    cy.submitButton("Update Consultation");
    cy.verifyNotification("Consultation updated successfully");
    cy.get("#diagnoses-view").should("not.contain.text", diagnosis5);
    patientConsultationPage.verifyTextInConsultation(
      "#history-presentillness",
      "editted",
    );
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
