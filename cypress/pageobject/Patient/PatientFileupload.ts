import { cy } from "local-cypress";

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
    cy.get("#upload_audio_file").click();
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

  archiveFile() {
    cy.get("button").contains("ARCHIVE").click().scrollIntoView();
    cy.get("#editFileName").clear().type("Cypress File Archive");
  }

  clickSaveArchiveFile() {
    cy.intercept("PATCH", "**/api/v1/files/**").as("saveArchiveFile");
    cy.submitButton("Proceed");
    cy.wait("@saveArchiveFile").its("response.statusCode").should("eq", 200);
  }

  verifyArchiveFile(fileName: string) {
    cy.get("#archived-files").click();
    cy.get("button").contains("MORE DETAILS").click().scrollIntoView();
    cy.get("#archive-file-name").should("contain.text", fileName);
    cy.get("#archive-file-reason").then(($reason) => {
      expect($reason.text().split(":")[1]).to.contain("Cypress File Archive");
    });
  }

  verifyFileRenameOption(status: boolean) {
    cy.get("#file-div").then(($fileDiv) => {
      if (status) {
        expect($fileDiv.text()).to.contain("RENAME");
      } else {
        expect($fileDiv.text()).to.not.contain("RENAME");
      }
    });
  }

  renameFile(newFileName: string) {
    cy.get("button").contains("RENAME").click().scrollIntoView();
    cy.get("#editFileName").clear().type(newFileName);
  }

  clickSaveFileName() {
    cy.intercept("PATCH", "**/api/v1/files/**").as("saveFileName");
    cy.submitButton("Proceed");
    cy.wait("@saveFileName").its("response.statusCode").should("eq", 200);
  }
}
