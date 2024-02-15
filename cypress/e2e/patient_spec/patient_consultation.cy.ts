import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import PatientPredefined from "../../pageobject/Patient/PatientPredefined";

describe("Patient Consultation in multiple combination", () => {
  const patientConsultationPage = new PatientConsultationPage();
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientPredefined = new PatientPredefined();
  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("OP Patient with Refer to another hospital consultation", () => {
    // Sore throat and fever symptoms
    // Comfort Care category
    // Four ICD-11 and one principal
    // no investigation
    // no review after and no action
  });

  it("Referred From another Facility Patient with OP consultation", () => {
    // Vomiting and Nausea symptoms
    // Stable category
    // one ICD-11 and no principal
    // no investigation
    // no review after and no action
  });

  it("Internal Transfer within facility Patient with Domicilary Care", () => {
    // Asymptomatic
    // Abnormal category
    // No ICD-11 error message then icd-11 add
    // add investigation
    // add review after and add action
    // add telemedicine
  });

  it("OP Patient with Declare Death", () => {
    // Asymptomatic
    // CRITICAL category
    // ICD-11 WITH PRINCIPAL
    // NO investigation
    // NO review after and NO action
  });

  it("OP Patient with admission consultation", () => {
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

    patientConsultationPage.enterConsultationDetails(
      "Stable",
      "Examination details and Clinical conditions",
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
