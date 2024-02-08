import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientFileUploadPage } from "../../pageobject/Patient/PatientFileupload";

describe("Patient Details", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientFileUploadPage = new PatientFileUploadPage();

  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Record an audio and save it", () => {
    patientPage.visitPatient("Cypress Patient");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.recordAudio();
    patientFileUploadPage.clickUploadAudioFile();
    patientFileUploadPage.verifySuccessNotification(
      "File Uploaded Successfully"
    );
  });

  it("Upload a file", () => {
    patientPage.visitPatient("Cypress Patient");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.uploadFile();
    patientFileUploadPage.clickUploadFile();
    patientFileUploadPage.verifySuccessNotification(
      "File Uploaded Successfully"
    );
  });

  it("Edit file name", () => {
    patientPage.visitPatient("Cypress Patient");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.clickEditFileName(
      `Cypress File ${new Date().getTime().toString().slice(9)}`
    );
    patientFileUploadPage.clickSaveFileName();
    patientFileUploadPage.verifySuccessNotification(
      "File name changed successfully"
    );
  });

  it("Archive file", () => {
    patientPage.visitPatient("Cypress Patient");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.clickArchiveFile();
    patientFileUploadPage.clickSaveArchiveFile();
    patientFileUploadPage.verifySuccessNotification(
      "File archived successfully"
    );
    patientFileUploadPage.verifyArchiveFile();
  });

  //TODO : Verify the uploaded file can only be modified by the author, district admin, and above users.

  //TODO : Verify file download is possible for all users.

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
