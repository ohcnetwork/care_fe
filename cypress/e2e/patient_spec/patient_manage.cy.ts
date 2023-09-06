import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientConsultationPage } from "../../pageobject/Patient/PatientConsultation";
import { phone_number } from "../../pageobject/constants";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";

describe("Patient", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientConsultationPage = new PatientConsultationPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.awaitUrl("/patients");
  });

  it("Create Patient shift requests.", () => {
    patientPage.visitPatient();
    patientConsultationPage.visitShiftRequestPage();
    patientConsultationPage.enterPatientShiftDetails(
      "Test User",
      phone_number,
      "Dummy Shifting",
      "Reason"
    );
    patientConsultationPage.createShiftRequest();
    patientConsultationPage.verifySuccessNotification(
      "Shift request created successfully"
    );
  });

  it("Post doctor notes for an already created patient", () => {
    patientPage.visitPatient();
    patientConsultationPage.visitDoctorNotesPage();
    patientConsultationPage.addDoctorsNotes("Test Doctor Notes");
    patientConsultationPage.postDoctorNotes();
    patientConsultationPage.verifySuccessNotification(
      "Note added successfully"
    );
  });

  it("Edit prescription for an already created patient", () => {
    patientPage.visitPatient();
    patientConsultationPage.visitEditPrescriptionPage();
    patientConsultationPage.discontinuePreviousPrescription();
    patientConsultationPage.verifySuccessNotification(
      "Prescription discontinued"
    );
    patientConsultationPage.clickAddPrescription();
    patientConsultationPage.prescribeMedicine();
    patientConsultationPage.enterDosage("4");
    patientConsultationPage.selectDosageFrequency("Twice daily");
    patientConsultationPage.submitPrescription();
  });

  it("Upload consultations file ", () => {
    patientPage.visitPatient();
    patientConsultationPage.visitFilesPage();
    patientConsultationPage.uploadFile();
    patientConsultationPage.clickUploadFile();
    patientConsultationPage.verifySuccessNotification(
      "File Uploaded Successfully"
    );
  });

  it("Discharge a patient", () => {
    patientPage.visitPatient();
    patientConsultationPage.clickDischargePatient();
    patientConsultationPage.selectDischargeReason("Recovered");
    patientConsultationPage.addDischargeNotes("Discharge notes");
    patientConsultationPage.confirmDischarge();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
