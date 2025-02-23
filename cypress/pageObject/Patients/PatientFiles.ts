export class PatientFiles {
  clickFilesTab() {
    cy.verifyAndClickElement('[data-cy="tab-files"]', "Files");
    return this;
  }

  clickAddFilesButton() {
    cy.verifyAndClickElement('[data-cy="add-files-button"]', "Add Files");
    return this;
  }

  uploadSingleFile(filePath: string) {
    cy.contains("Upload From Device").should("be.visible");
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
    cy.get('[data-cy="upload-files-button"]').click();
    return this;
  }

  verifyValidationErrors(errorMessage: string) {
    cy.contains(errorMessage).then(($errors) => {
      cy.wrap($errors).each(($error) => {
        cy.wrap($error).scrollIntoView().should("be.visible");
      });
    });
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
    cy.intercept("GET", "**/api/v1/files/?**").as("filterFiles");
    return this;
  }

  verifyFilterApiCall() {
    cy.wait("@filterFiles").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
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
    cy.wait(300);
    return this;
  }

  verifyMultipleFileUploadSuccess(message: string) {
    cy.verifyNotification(message);
    cy.wait(200);
    cy.verifyNotification(message);
    cy.wait(200);
    cy.verifyNotification(message);
    cy.wait(300);
    return this;
  }

  verifyFilesAdded(fileNames: string[]) {
    fileNames.forEach((fileName) => {
      cy.verifyContentPresence(`[data-cy="${fileName}"]`, [fileName]);
    });
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

  clickFileDetailsButton(fileName: string) {
    cy.get(`[data-cy="${fileName}"] [data-cy="file-options-button"]`).click({
      force: true,
    });
    return this;
  }

  clickDownloadFile() {
    cy.verifyAndClickElement('[data-cy="download-button"]', "Download");
    return this;
  }

  clickRenameOption() {
    cy.verifyAndClickElement('[data-cy="rename-button"]', "Rename");
    return this;
  }

  fillNewFileName(newFileName: string) {
    cy.typeIntoField('[data-cy="edit-file-input"]', newFileName, {
      clearBeforeTyping: true,
    });
    return this;
  }

  clickProceedButton() {
    cy.contains("button", "Proceed").should("be.enabled").click();
    return this;
  }

  clickArchiveOption() {
    cy.verifyAndClickElement('[data-cy="file-archive-option"]', "Archive");
    cy.contains("button", "Archive").should("be.enabled").click();
    return this;
  }

  fillArchiveReason(archiveReason: string) {
    cy.typeIntoField('[data-cy="archive-reason-textarea"]', archiveReason, {
      clearBeforeTyping: true,
    });
    return this;
  }

  clickViewFile(fileName: string) {
    cy.get(`[data-cy="${fileName}"]`)
      .contains("button", "View")
      .click({ force: true });
    return this;
  }

  verifyArchiveReason(reason: string) {
    cy.verifyContentPresence('[data-cy="archive-reason"]', [reason]);
    return this;
  }

  filterActiveFiles() {
    this.interceptFilterRequest();
    cy.verifyAndClickElement('[data-cy="filter-button"]', "Filter");
    cy.verifyAndClickElement('[data-cy="active-files-button"]', "Active Files");
    this.verifyFilterApiCall();
    return this;
  }

  filterArchivedFiles() {
    this.interceptFilterRequest();
    cy.verifyAndClickElement('[data-cy="filter-button"]', "Filter");
    cy.verifyAndClickElement(
      '[data-cy="archived-files-button"]',
      "Archived Files",
    );
    this.verifyFilterApiCall();
    return this;
  }

  removeFilter() {
    cy.verifyAndClickElement('[data-cy="filter-badge"]', "Active Files");
    this.verifyFilterApiCall();
    return this;
  }

  // CONVERT TO PDF
}
