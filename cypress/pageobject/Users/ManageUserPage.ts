export class ManageUserPage {
  assertHomeFacility(expectedText) {
    cy.get("#home_facility").should("contain.text", expectedText);
  }

  clickFacilitiesTab() {
    cy.get("#facilities").click();
  }

  typeFacilityName(facilityName) {
    cy.get("input[name='facility']").click().type(facilityName);
  }

  selectFacilityFromDropdown(facilityName) {
    cy.get("[role='option']").contains(facilityName).click();
  }

  clickLinkFacility() {
    cy.get("#link-facility").click();
  }

  assertLinkedFacility(facilityName) {
    cy.get("#linked-facility-list").should("contain.text", facilityName);
  }

  assertnotLinkedFacility(facilityName) {
    cy.get("#linked-facility-list").should("not.contain", facilityName);
  }

  linkedfacilitylistnotvisible() {
    cy.get("#linked-facility-list").should("not.exist");
  }

  assertHomeFacilitylink(facilityName) {
    cy.get("#home-facility").should("contain.text", facilityName);
  }

  assertFacilityNotInDropdown(facilityName) {
    this.typeFacilityName(facilityName);
    cy.get("[role='option']").should("not.exist");
  }

  clickCloseSlideOver() {
    cy.get("#close-slide-over").click();
  }

  clickHomeFacilityIcon() {
    cy.get("#home-facility-icon").click();
  }

  clickUnlinkFacilityButton() {
    cy.get("#unlink-facility-button").click();
  }

  clickSubmit() {
    cy.get("#submit").click();
  }

  navigateToFacility() {
    cy.visit("/facility");
  }

  typeFacilitySearch(facilityName) {
    cy.get("#search").click().type(facilityName);
  }

  assertFacilityInCard(facilityName) {
    cy.get("#facility-name-card").should("contain", facilityName);
  }

  clickFacilityPatients() {
    cy.get("#facility-patients").click();
  }

  clickDoctorConnectButton() {
    cy.get("#doctor-connect-patient-button").click();
  }

  assertDoctorConnectVisibility(realName) {
    cy.get("#doctor-connect-home-doctor").should("contain.text", realName);
    cy.get("#doctor-connect-remote-doctor").should("contain.text", realName);
  }
}

export default ManageUserPage;
