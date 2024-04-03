import { afterEach, before, beforeEach, cy, describe, it } from "local-cypress";
import LoginPage from "../../pageobject/Login/LoginPage";
import { PatientPage } from "../../pageobject/Patient/PatientCreation";
import { PatientFileUpload } from "../../pageobject/Patient/PatientFileupload";

describe("Patient Details", () => {
  const loginPage = new LoginPage();
  const patientPage = new PatientPage();
  const patientFileUpload = new PatientFileUpload();
  const cypressAudioName = "cypress audio";
  const cypressFileName = "cypress name";
  const newFileName = "cypress modified name";
  const patientNameOne = "Dummy Patient 3";
  const patientNameTwo = "Dummy Patient 4";
  const patientNameThree = "Dummy Patient 5";
  before(() => {
    loginPage.loginAsDisctrictAdmin();
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/patients");
  });

  it("Record an Audio and download the file", () => {
    // Record an audio
    patientPage.visitPatient(patientNameOne);
    patientFileUpload.visitPatientDetailsPage();
    patientFileUpload.recordAudio();
    patientFileUpload.typeAudioName(cypressAudioName);
    patientFileUpload.clickUploadAudioFile();
    // Verify the audio file is uploaded
    cy.verifyNotification("File Uploaded Successfully");
    patientFileUpload.verifyUploadFilePresence(cypressAudioName);
    // Verify the download of the audio file
    cy.get("button").contains("DOWNLOAD").click();
    cy.verifyNotification("Downloading file...");
  });

  it("Upload a File and archive it", () => {
    // Upload the file
    patientPage.visitPatient(patientNameTwo);
    patientFileUpload.visitPatientDetailsPage();
    patientFileUpload.uploadFile();
    patientFileUpload.typeFileName(cypressFileName);
    patientFileUpload.clickUploadFile();
    // Verify the file is uploaded
    cy.verifyNotification("File Uploaded Successfully");
    cy.closeNotification();
    patientFileUpload.verifyUploadFilePresence(cypressFileName);
    // Archive the file
    patientFileUpload.archiveFile();
    patientFileUpload.clickSaveArchiveFile();
    cy.verifyNotification("File archived successfully");
    patientFileUpload.verifyArchiveFile(cypressFileName);
  });

  it("User-level Based Permission for File Modification", () => {
    // Login as Nurse 1
    loginPage.login("dummynurse1", "Coronasafe@123");
    cy.reload();
    // Visit the patient details page
    patientPage.visitPatient(patientNameThree);
    patientFileUpload.visitPatientDetailsPage();
    // Upload the file
    patientFileUpload.uploadFile();
    patientFileUpload.typeFileName(cypressFileName);
    patientFileUpload.clickUploadFile();
    // Verify the file is uploaded
    cy.verifyNotification("File Uploaded Successfully");
    cy.closeNotification();
    patientFileUpload.verifyUploadFilePresence(cypressFileName);
    // Edit the file name
    patientFileUpload.verifyFileRenameOption(true);
    patientFileUpload.renameFile(newFileName);
    patientFileUpload.clickSaveFileName();
    // Verify the file name is changed
    cy.verifyNotification("File name changed successfully");
    cy.closeNotification();
    patientFileUpload.verifyUploadFilePresence(newFileName);
    // Login as Nurse 2
    loginPage.login("dummynurse2", "Coronasafe@123");
    cy.reload();
    // Verify the file edit option is not available
    patientFileUpload.verifyUploadFilePresence(newFileName);
    patientFileUpload.verifyFileRenameOption(false);
    // Login as District Admin
    loginPage.loginAsDisctrictAdmin();
    cy.reload();
    // Verify the file edit option is available
    patientFileUpload.verifyUploadFilePresence(newFileName);
    patientFileUpload.verifyFileRenameOption(true);
    patientFileUpload.renameFile(cypressFileName);
    patientFileUpload.clickSaveFileName();
    // Verify the file name is changed
    cy.verifyNotification("File name changed successfully");
    cy.closeNotification();
    patientFileUpload.verifyUploadFilePresence(cypressFileName);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
