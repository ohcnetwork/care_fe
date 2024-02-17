import { cy } from "local-cypress";

let fileName = "";

export class PatientFileUploadPage {
  visitPatientDetailsPage() {
    cy.get("#patient-details").click();
    cy.get("#upload-patient-files").click();
  }

  recordAudio() {
    cy.get("#record-audio").click();
    cy.wait(5000);
    cy.get("#stop-recording").click();
  }

  clickUploadAudioFile() {
    cy.intercept("POST", "**/api/v1/files/").as("uploadAudioFile");
    cy.get("#upload-audio-file").click();
    cy.wait("@uploadAudioFile").its("response.statusCode").should("eq", 201);
  }

  uploadFile() {
    cy.get("#file_upload_patient").selectFile(
      "cypress/fixtures/sampleAsset.xlsx",
      { force: true }
    );
  }

  clickUploadFile() {
    cy.intercept("POST", "**/api/v1/files/").as("uploadFile");
    cy.get("#upload_file_button").click();
    cy.wait("@uploadFile").its("response.statusCode").should("eq", 201);
  }

  editFileName(newFileName: string) {
    cy.get("#edit-file-name").click().scrollIntoView();
    cy.get("#editFileName").clear().type(newFileName);
  }

  clickSaveFileName() {
    cy.intercept("PATCH", "**/api/v1/files/**").as("saveFileName");
    cy.get("#submit").click();
    cy.wait("@saveFileName").its("response.statusCode").should("eq", 200);
  }

  archiveFile() {
    cy.wait(2000);
    cy.get("#file-name").then(($el: string) => {
      fileName = $el.text().split(":")[1].trim();
    });
    cy.get("#archive-file").click().scrollIntoView();
    cy.get("#editFileName").clear().type("Cypress File Archive");
  }

  clickSaveArchiveFile() {
    cy.intercept("PATCH", "**/api/v1/files/**").as("saveArchiveFile");
    cy.get("#submit").click();
    cy.wait("@saveArchiveFile").its("response.statusCode").should("eq", 200);
  }

  verifyArchiveFile() {
    cy.get("#archived-files").click();
    cy.get("#file-name").then(($el) => {
      const text = $el.text().split(":")[1].trim();
      cy.expect(text).to.eq(fileName);
    });
  }

  verifyFileEditOption(status: boolean) {
    cy.get("#edit-file-name").should(status ? "be.visible" : "not.exist");
  }

  verifyFileDownloadOption(status: boolean) {
    cy.get("#preview-file").should(status ? "be.visible" : "not.be.visible");
  }

  downloadFile() {
    cy.intercept("GET", "**/api/v1/files/**").as("downloadFile");
    cy.get("#preview-file").click();
    cy.wait("@downloadFile").its("response.statusCode").should("eq", 200);
  }

  verifySuccessNotification(msg: string) {
    cy.verifyNotification(msg);
  }
}
