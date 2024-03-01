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

  it("Upload the file and download it", () => {
    // Upload the file
    patientPage.visitPatient("Dummy Patient 3");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.uploadFile();
    const fileName = `Cypress File ${new Date().getTime().toString().slice(9)}`;
    cy.get("#consultation_file").clear().type(fileName);
    patientFileUploadPage.clickUploadFile();

    // Verify the file is uploaded
    cy.verifyNotification("File Uploaded Successfully");
    cy.get("#file-name").should("contain.text", fileName);

    // Download the file
    patientFileUploadPage.downloadFile();
  });

  it("Record an audio and archive it", () => {
    // Record an audio
    patientPage.visitPatient("Dummy Patient 4");
    patientFileUploadPage.visitPatientDetailsPage();
    patientFileUploadPage.recordAudio();
    const fileName = `Cypress Audio ${new Date()
      .getTime()
      .toString()
      .slice(9)}`;
    cy.get("#consultation_audio_file")
      .clear()
      .type(`Cypress Audio ${fileName}`);
    patientFileUploadPage.clickUploadAudioFile();

    // Verify the audio file is uploaded
    cy.verifyNotification("File Uploaded Successfully");
    cy.get("#audio-file-name").should("contain.text", fileName);

    // Archive the audio file
    patientFileUploadPage.archiveFile();
    patientFileUploadPage.clickSaveArchiveFile();
    cy.verifyNotification("File archived successfully");
    patientFileUploadPage.verifyArchiveFile(fileName);
  });

  it("User-level Based Permission for File Modification", () => {
    // Login as Nurse 1
    loginPage.login("dummynurse1", "Coronasafe@123");
    patientPage.visitPatient("Dummy Patient 5");
    patientFileUploadPage.visitPatientDetailsPage();

    // Upload the file
    patientFileUploadPage.uploadFile();
    const oldFileName = `Cypress File ${new Date()
      .getTime()
      .toString()
      .slice(9)}`;
    cy.get("#consultation_file").clear();
    cy.get("#consultation_file").type(oldFileName);
    patientFileUploadPage.clickUploadFile();

    // Verify the file is uploaded
    cy.verifyNotification("File Uploaded Successfully");
    cy.get("#file-name").should("contain.text", oldFileName);
    patientFileUploadPage.verifyFileEditOption(true);

    // Edit the file name
    const newFileName = `Cypress File ${new Date()
      .getTime()
      .toString()
      .slice(9)}`;
    patientFileUploadPage.editFileName(newFileName);
    patientFileUploadPage.clickSaveFileName();

    // Verify the file name is changed
    cy.verifyNotification("File name changed successfully");
    cy.get("#file-name").should("contain.text", newFileName);

    // Login as Nurse 2
    loginPage.login("dummynurse2", "Coronasafe@123");
    cy.reload();

    // Verify the file edit option is not available
    cy.get("#file-name").should("contain.text", newFileName);
    patientFileUploadPage.verifyFileEditOption(false);

    // Login as District Admin
    loginPage.loginAsDisctrictAdmin();
    cy.reload();

    // Verify the file edit option is available
    cy.get("#file-name").should("contain.text", newFileName);
    patientFileUploadPage.verifyFileEditOption(true);
    patientFileUploadPage.editFileName(oldFileName);
    patientFileUploadPage.clickSaveFileName();

    // Verify the file name is changed
    cy.verifyNotification("File name changed successfully");
    cy.get("#file-name").should("contain.text", oldFileName);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
