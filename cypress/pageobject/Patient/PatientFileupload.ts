export class PatientFileUpload {
  clickFileUploadIcon() {
    cy.get("#patient-details").click();
    cy.get("#upload-patient-files").click();
  }

  typeAudioName(name: string) {
    cy.get("#upload-file-name").clear();
    cy.get("#upload-file-name").click().type(name);
  }

  clickFileTab() {
    cy.verifyAndClickElement("#consultation_tab_nav", "Files");
  }

  typeFileName(name: string) {
    cy.get("#upload-file-name").clear();
    cy.get("#upload-file-name").click().type(name);
  }

  recordAudio() {
    cy.get("#record-audio").click();
    cy.wait(5000);
    cy.get("#stop-recording").click();
    cy.wait(1000);
    cy.get("#save-recording").click();
  }

  clickUploadAudioFile() {
    cy.intercept("POST", "**/api/v1/files/").as("uploadAudioFile");
    cy.verifyAndClickElement("#upload_file_button", "Upload");
    cy.wait("@uploadAudioFile").its("response.statusCode").should("eq", 201);
  }

  verifyUploadFilePresence(fileName: string) {
    cy.wait(2000);
    cy.get("#file-div").scrollIntoView();
    cy.verifyContentPresence("#file-div", [fileName]);
  }

  uploadFile() {
    cy.get("#file_upload_patient").selectFile(
      "cypress/fixtures/sample-asset.xlsx",
      { force: true },
    );
  }

  clickUploadFile() {
    cy.intercept("POST", "**/api/v1/files/").as("uploadFile");
    cy.get("#upload_file_button").click();
    cy.wait("@uploadFile").its("response.statusCode").should("eq", 201);
  }

  archiveFile() {
    cy.get("#file-div button").contains("Archive").click().scrollIntoView();
    cy.get("#archive-file-reason").clear().type("Cypress File Archive");
  }

  clickSaveArchiveFile() {
    cy.intercept("PATCH", "**/api/v1/files/**").as("saveArchiveFile");
    cy.clickSubmitButton("Proceed");
    cy.wait("@saveArchiveFile").its("response.statusCode").should("eq", 200);
  }

  verifyArchiveFile(fileName: string) {
    cy.get("button").contains("Archived Files").click();
    cy.get("button").contains("More Info").click().scrollIntoView();
    cy.get('[data-archive-info="File Name"]').should("contain.text", fileName);
    cy.get('[data-archive-info="Archive Reason"]').should(
      "contain.text",
      "Cypress File Archive",
    );
  }

  verifyFileRenameOption(status: boolean) {
    cy.get("#file-div").then(($fileDiv) => {
      if (status) {
        expect($fileDiv.text()).to.contain("Rename");
      } else {
        expect($fileDiv.text()).to.not.contain("Rename");
      }
    });
  }

  renameFile(newFileName: string) {
    cy.get("button").contains("Rename").click().scrollIntoView();
    cy.get("#edit-file-name").clear().type(newFileName);
  }

  clickSaveFileName() {
    cy.intercept("PATCH", "**/api/v1/files/**").as("saveFileName");
    cy.clickSubmitButton("Proceed");
    cy.wait("@saveFileName").its("response.statusCode").should("eq", 200);
  }
}
