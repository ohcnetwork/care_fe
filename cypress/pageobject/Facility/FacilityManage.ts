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

  verifyTotalDoctorCapacity(expectedCapacity) {
    cy.get("#facility-doctor-totalcapacity").contains(expectedCapacity);
  }

  verifyFacilityBedCapacity(expectedCapacity) {
    cy.get("#facility-bed-capacity-details").contains(expectedCapacity);
  }

  clickEditFacilityDoctorCapacity() {
    cy.get("#edit-facility-doctorcapacity").click();
  }

  clickEditFacilityBedCapacity() {
    cy.get("#edit-facility-bedcapacity").click();
  }

  clickDeleteFacilityDoctorCapacity() {
    cy.get("#delete-facility-doctorcapacity").click();
  }

  clickDeleteFacilityBedCapacity() {
    cy.get("#delete-facility-bedcapacity").click();
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

  clickButtonWithText(text) {
    cy.get("button#submit").contains(text).click();
  }

  checkErrorMessageVisibility(text) {
    cy.get(".error-text").contains(text).should("be.visible");
  }

  typeMiddlewareAddress(address) {
    cy.get("#middleware_address").click().clear().click().type(address);
  }

  clearHfrId() {
    cy.get("#hf_id").click().clear();
  }

  typeHfrId(address) {
    cy.get("#hf_id").click().clear().click().type(address);
  }

  verifySuccessMessageVisibilityAndContent(text, isRegex = false) {
    if (isRegex) {
      cy.get(".pnotify-text").should("be.visible").contains(text);
    } else {
      cy.get(".pnotify-text").should("be.visible").and("contain.text", text);
    }
  }

  verifyMiddlewareAddressValue(expectedValue) {
    cy.get("#middleware_address").should("have.value", expectedValue);
  }

  verifyHfrIdValue(expectedValue) {
    cy.get("#hf_id").should("have.value", expectedValue);
  }

  clickFacilityAddDoctorTypeButton() {
    cy.get("#facility-add-doctortype").scrollIntoView();
    cy.get("#facility-add-doctortype").click();
  }

  clickFacilityAddBedTypeButton() {
    cy.get("#facility-add-bedtype").scrollIntoView();
    cy.get("#facility-add-bedtype").click();
  }
}
export default FacilityManage;
