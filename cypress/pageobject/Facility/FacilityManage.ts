class FacilityManage {
  clickCoverImage() {
    cy.get("#facility-coverimage").click({ force: true });
  }

  verifyUploadButtonVisible() {
    cy.get("#upload-cover-image").should("be.visible");
  }

  uploadCoverImage(fileName) {
    cy.get("#upload-cover-image")
      .selectFile(`cypress/fixtures/${fileName}`, { force: true })
      .wait(100); // Adjust the wait time as needed
  }

  clickSaveCoverImage() {
    cy.get("#save-cover-image").scrollIntoView();
    cy.get("#save-cover-image").click();
  }
}
export default FacilityManage;
