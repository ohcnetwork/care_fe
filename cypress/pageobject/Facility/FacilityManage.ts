class FacilityManage {
  clickCoverImage() {
    cy.get("#facility-coverimage").click();
  }

  verifyUploadButtonVisible() {
    cy.get("#upload-cover-image").should("be.visible");
  }

  uploadCoverImage(fileName: string) {
    cy.get("#upload-cover-image")
      .selectFile(`cypress/fixtures/${fileName}`, { force: true })
      .wait(100); // Adjust the wait time as needed
  }

  clickSaveCoverImage() {
    cy.get("#save-cover-image").scrollIntoView();
    cy.get("#save-cover-image").click();
  }

  clickFacilityConfigureButton() {
    cy.get("#configure-facility").should("be.visible");
    cy.get("#configure-facility").click();
  }

  verifyMiddlewareAddressVisible() {
    cy.get("#middleware_address").should("be.visible");
  }

  clickButtonWithText(text: string) {
    cy.get("button#submit").contains(text).click();
  }

  checkErrorMessageVisibility(text: string) {
    cy.get(".error-text").contains(text).should("be.visible");
  }

  typeMiddlewareAddress(address: string) {
    cy.get("#middleware_address").click().clear().click().type(address);
  }

  clearHfrId() {
    cy.get("#hf_id").click().clear();
  }

  typeHfrId(address: string) {
    cy.get("#hf_id").click().clear().click().type(address);
  }

  verifySuccessMessageVisibilityAndContent(
    text: string | RegExp,
    isRegex = false,
  ) {
    if (isRegex) {
      cy.get(".pnotify-text").should("be.visible").contains(text);
    } else {
      cy.get(".pnotify-text").should("be.visible").and("contain.text", text);
    }
  }

  verifyMiddlewareAddressValue(expectedValue: string) {
    cy.get("#middleware_address").should("have.value", expectedValue);
  }

  verifyHfrIdValue(expectedValue: string) {
    cy.get("#hf_id").should("have.value", expectedValue);
  }

  visitViewPatients() {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilityPatients");
    cy.get("#view-patient-facility-list").scrollIntoView().click();
    cy.wait("@getFacilityPatients")
      .its("response.statusCode")
      .should("eq", 200);
  }
}
export default FacilityManage;
