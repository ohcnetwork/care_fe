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
    patientPage.visitPatient("Dummy Patient 3");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.recordAudio();
    patientFileUploadPage.clickUploadAudioFile();
    patientFileUploadPage.verifySuccessNotification(
      "File Uploaded Successfully"
    );
  });

  it("Upload a file", () => {
    patientPage.visitPatient("Dummy Patient 4");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.uploadFile();
    patientFileUploadPage.clickUploadFile();
    patientFileUploadPage.verifySuccessNotification(
      "File Uploaded Successfully"
    );
  });

  it("Edit file name", () => {
    patientPage.visitPatient("Dummy Patient 4");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.editFileName(
      `Cypress File ${new Date().getTime().toString().slice(9)}`
    );
    patientFileUploadPage.clickSaveFileName();
    patientFileUploadPage.verifySuccessNotification(
      "File name changed successfully"
    );
  });

  it("Archive file and verify it", () => {
    patientPage.visitPatient("Dummy Patient 4");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.archiveFile();
    patientFileUploadPage.clickSaveArchiveFile();
    patientFileUploadPage.verifySuccessNotification(
      "File archived successfully"
    );
    patientFileUploadPage.verifyArchiveFile();
  });

  it("Verify the uploaded file can be edited by author", () => {
    loginPage.login("dummynurse1", "Coronasafe@123");
    patientPage.visitPatient("Dummy Patient 5");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.uploadFile();
    patientFileUploadPage.clickUploadFile();
    patientFileUploadPage.verifyFileEditOption(true);
    patientFileUploadPage.editFileName(
      `Cypress File ${new Date().getTime().toString().slice(9)}`
    );
    patientFileUploadPage.clickSaveFileName();
    patientFileUploadPage.verifySuccessNotification(
      "File name changed successfully"
    );
  });

  it("Verify the uploaded file cannot be edited by other users below district admin", () => {
    loginPage.login("dummynurse2", "Coronasafe@123");
    patientPage.visitPatient("Dummy Patient 5");
    patientFileUploadPage.visitPatientDetailsPage();
    cy.wait(2000);
    patientFileUploadPage.verifyFileEditOption(false);
  });

  it("Verify the uploaded file can be edited by district admin and above", () => {
    loginPage.loginAsDisctrictAdmin();
    patientPage.visitPatient("Dummy Patient 5");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.verifyFileEditOption(true);
    patientFileUploadPage.editFileName(
      `Cypress File ${new Date().getTime().toString().slice(9)}`
    );
    patientFileUploadPage.clickSaveFileName();
    patientFileUploadPage.verifySuccessNotification(
      "File name changed successfully"
    );
  });

  it("Verify that file download is possible for author", () => {
    loginPage.login("dummynurse1", "Coronasafe@123");
    patientPage.visitPatient("Dummy Patient 5");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.verifyFileDownloadOption(true);
    patientFileUploadPage.downloadFile();
  });

  it("Verify that file download is possible for users below district admin", () => {
    loginPage.login("dummynurse2", "Coronasafe@123");
    patientPage.visitPatient("Dummy Patient 5");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.verifyFileDownloadOption(true);
    patientFileUploadPage.downloadFile();
  });

  it("Verify that file download is possible for district admin and above", () => {
    loginPage.loginAsDisctrictAdmin();
    patientPage.visitPatient("Dummy Patient 5");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.verifyFileDownloadOption(true);
    patientFileUploadPage.downloadFile();
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
