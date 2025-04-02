export class PatientFiles {
  private savedUrl: string = "";

  clickFilesTab() {
    cy.verifyAndClickElement('[data-cy="tab-files"]', "Files");
    return this;
  }

  clickAddFilesButton() {
    cy.verifyAndClickElement('[data-cy="add-files-button"]', "Add Files");
    return this;
  }

  selectUploadFromDevice() {
    cy.verifyAndClickElement(
      '[data-cy="choose-file-option"]',
      "Upload From Device",
    );
    return this;
  }

  uploadSingleFile(filePath: string) {
    cy.get('input[type="file"]').selectFile(filePath, { force: true });
    return this;
  }

  uploadMultipleFiles(filePaths: string[]) {
    cy.contains("Upload From Device").should("be.visible");
    cy.get('input[type="file"]').selectFile(
      filePaths.map((file) => ({
        contents: file,
      })),
      { force: true },
    );
    return this;
  }

  clickUploadFilesButton() {
    cy.verifyAndClickElement('[data-cy="upload-files-button"]', "Upload");
    return this;
  }

  verifyValidationErrors(errorMessage: string) {
    cy.verifyErrorMessages([
      {
        label: "Enter File Name",
        message: errorMessage,
      },
    ]);
    return this;
  }

  fillMultipleFileNames(fileNames: string[]) {
    cy.get("input").each(($input, index) => {
      cy.wrap($input).clear();
      cy.wrap($input).type(`${fileNames[index]}`);
    });
    return this;
  }

  fillSingleFileName(fileName: string) {
    cy.get("input").type(fileName);
    return this;
  }

  interceptFileUploadRequest() {
    cy.intercept("POST", "**/api/v1/files/").as("uploadFile");
    return this;
  }

  interceptFileRenameRequest() {
    cy.intercept("PUT", "**/api/v1/files/**").as("renameFile");
    return this;
  }

  interceptFileArchiveRequest() {
    cy.intercept("POST", "**/api/v1/files/**").as("archiveFile");
    return this;
  }

  interceptFilterRequest() {
    cy.intercept("GET", "**/api/v1/files/**").as("filterFiles");
    return this;
  }

  verifyFilterApiCall() {
    cy.wait("@filterFiles").its("response.statusCode").should("eq", 200);
    return this;
  }

  verifyFileUploadApiCall() {
    cy.wait("@uploadFile").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  verifyFileRenameApiCall() {
    cy.wait("@renameFile").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  verifyFileArchiveApiCall() {
    cy.wait("@archiveFile").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
    return this;
  }

  verifySingleFileUploadSuccess(message: string) {
    cy.verifyNotification(message);
    return this;
  }

  verifyMultipleFileUploadSuccess(message: string) {
    cy.verifyNotification(message);
    return this;
  }

  clickRecordAudioButton() {
    cy.get('[data-cy="record-audio-button"]').click();
    return this;
  }

  startRecordingAudio() {
    cy.get('[data-cy="start-recording-button"]')
      .should("be.visible")
      .should("be.enabled")
      .click();
    cy.wait(2000);
    return this;
  }

  stopRecordingAudio() {
    cy.get('[data-cy="stop-recording-button"]')
      .should("be.visible")
      .should("be.enabled")
      .click();
    cy.wait(1000);
    return this;
  }

  clickCancelAudioButton() {
    cy.get('[data-cy="cancel-audio-button"]').click();
    return this;
  }

  clickStartAgainButton() {
    cy.get('[data-cy="start-again-button"]').click();
    cy.wait(2000);
    return this;
  }

  clickSaveAudioButton() {
    cy.get('[data-cy="save-recording-button"]').click();
    return this;
  }

  clickFileDetailsButton() {
    cy.get(`[data-cy="file-options-button"]`).first().click({ force: true });
    return this;
  }

  clickDownloadFile() {
    cy.verifyAndClickElement('[data-cy="file-preview-download"]', "Download");
    return this;
  }

  clickRenameOption() {
    cy.verifyAndClickElement('[data-cy="file-rename-button"]', "Rename");
    return this;
  }

  fillNewFileName(newFileName: string) {
    cy.typeIntoField('[data-cy="edit-filename-input"]', newFileName, {
      clearBeforeTyping: true,
    });
    return this;
  }

  clickProceedButton() {
    cy.clickSubmitButton("Proceed");
    return this;
  }

  clickArchiveOption() {
    cy.verifyAndClickElement('[data-cy="file-archive-option"]', "Archive");
    return this;
  }

  fillArchiveReason(archiveReason: string) {
    cy.typeIntoField('[data-cy="archive-reason-textarea"]', archiveReason, {
      clearBeforeTyping: true,
    });
    return this;
  }

  clickFirstFileViewButton() {
    cy.get('[data-cy="file-view-button"]').first().click({ force: true });
    return this;
  }

  saveCurrentUrl() {
    cy.saveCurrentUrl();
    return this;
  }

  filterActiveFiles() {
    this.interceptFilterRequest();
    cy.verifyAndClickElement('[data-cy="files-filter-button"]', "Filter");
    cy.verifyAndClickElement('[data-cy="active-files-button"]', "Active Files");
    this.verifyFilterApiCall();
    return this;
  }

  closeFilePreview() {
    cy.get('[data-cy="file-preview-download"]').should("be.visible");
    cy.contains("button", "Close").click();
    return this;
  }

  openCamera() {
    cy.get('[data-cy="open-camera-button"]').click();
    return this;
  }

  captureImage() {
    cy.verifyAndClickElement('[data-cy="capture-button"]', "Capture");
    return this;
  }

  clickSubmit() {
    cy.verifyAndClickElement('[data-cy="capture-submit-button"]', "Submit");
    return this;
  }

  navigateToSavedUrl() {
    cy.navigateToSavedUrl();
    return this;
  }
}
