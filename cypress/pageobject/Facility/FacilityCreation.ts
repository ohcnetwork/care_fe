// FacilityPage.ts
import { cy } from "local-cypress";

class FacilityPage {
  visitCreateFacilityPage() {
    cy.visit("/facility/create");
  }

  visitUpdateFacilityPage(url: string) {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.visit(url);
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("#manage-facility-dropdown button").should("be.visible");
  }

  clickUpdateFacilityType() {
    cy.get("#facility_type")
      .click()
      .then(() => {
        cy.get("[role='option']").contains("Request Approving Center").click();
      });
  }

  fillFacilityName(name: string) {
    cy.get("#name").clear().type(name);
  }

  fillPincode(pincode: string) {
    cy.get("#pincode").click().type(pincode);
  }

  selectState(state: string) {
    cy.get("div#state button").click();
    cy.get("[role='option']").contains(state).click();
  }

  selectDistrict(district: string) {
    cy.get("div#district button").click();
    cy.get("[role='option']").contains(district).click();
  }

  selectLocalBody(localBody: string) {
    cy.get("div#local_body button").click();
    cy.get("[role='option']").contains(localBody).click();
  }

  selectWard(ward: string) {
    cy.get("div#ward button").click();
    cy.get("[role='option']").contains(ward).click();
  }

  fillAddress(address: string) {
    cy.get("#address").click().clear().type(address);
  }

  fillPhoneNumber(phoneNumber: string) {
    cy.get("#phone_number").type(phoneNumber);
  }

  submitForm() {
    cy.get("button#submit").click();
  }

  selectBedType(bedType: string) {
    cy.get("div#bed-type button").click();
    cy.get("[role='option']").contains(bedType).click();
  }

  fillTotalCapacity(capacity: string) {
    cy.get("input#total-capacity").click().type(capacity);
  }

  fillCurrentlyOccupied(occupied: string) {
    cy.get("input#currently-occupied").click().type(occupied);
  }

  saveAndExitBedCapacityForm() {
    cy.get("button#bed-capacity-save-and-exit").click();
  }

  selectAreaOfSpecialization(area: string) {
    cy.get("div#area-of-specialization button").click();
    cy.get("[role='option']").contains(area).click();
  }

  fillDoctorCount(count: string) {
    cy.get("input#count").click().type(count);
  }

  fillOxygenCapacity(capacity: string) {
    cy.get("#oxygen_capacity").click().clear().type(capacity);
  }

  fillExpectedOxygenRequirement(requirement: string) {
    cy.get("#expected_oxygen_requirement").click().clear().type(requirement);
  }

  saveAndExitDoctorForm() {
    cy.get("button#save-and-exit").click();
  }

  clickManageFacilityDropdown() {
    cy.get("#manage-facility-dropdown button")
      .contains("Manage Facility")
      .click();
  }

  clickUpdateFacilityOption() {
    cy.get("#update-facility").contains("Update Facility").click();
  }

  clickConfigureFacilityOption() {
    cy.get("#configure-facility").contains("Configure Facility").click();
  }

  clickInventoryManagementOption() {
    cy.get("[id=inventory-management]").click();
  }

  clickResourceRequestOption() {
    cy.get("#resource-request").contains("Resource Request").click();
  }

  clickDeleteFacilityOption() {
    cy.get("#delete-facility").contains("Delete Facility").click();
  }

  confirmDeleteFacility() {
    cy.get("#submit").contains("Delete").click();
  }

  selectLocation(location: string) {
    cy.get("span > svg.care-svg-icon__baseline.care-l-map-marker").click();
    cy.intercept("https://maps.googleapis.com/maps/api/mapsjs/*").as("mapApi");
    cy.wait("@mapApi").its("response.statusCode").should("eq", 200);
    cy.get("input#pac-input").type(location).type("{enter}");
    cy.get("div#map-close").click();
  }

  fillMiddleWareAddress(url: string) {
    cy.get("#middleware_address").type(url);
  }

  clickupdateMiddleWare() {
    cy.get("button#submit").first().click();
  }

  verifySuccessNotification(message: string) {
    cy.verifyNotification(message);
  }

  visitAlreadyCreatedFacility() {
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("[id='facility-details']").first().click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("#manage-facility-dropdown button").should("be.visible");
    cy.get("[id=manage-facility-dropdown]").scrollIntoView().click();
  }

  clickManageInventory() {
    cy.contains("Manage Inventory").click();
  }

  fillInventoryDetails(name: string, status: string, quantity: string) {
    cy.get("div#id").click();
    cy.get("div#id ul li").contains(name).click();
    cy.get("div#isIncoming").click();
    cy.get("div#isIncoming ul li").contains(status).click();
    cy.get("[name='quantity']").type(quantity);
  }

  clickAddInventory() {
    cy.get("button").contains("Add/Update Inventory").click();
  }

  fillResourceRequestDetails(
    name: string,
    phone_number: string,
    facility: string,
    title: string,
    quantity: string,
    description: string
  ) {
    cy.get("#refering_facility_contact_name").type(name);
    cy.get("#refering_facility_contact_number").type(phone_number);
    cy.get("[name='approving_facility']")
      .type(facility)
      .then(() => {
        cy.get("[role='option']").first().click();
      });
    cy.get("#title").type(title);
    cy.get("#requested_quantity").type(quantity);
    cy.get("#reason").type(description);
  }

  clickSubmitRequestButton() {
    cy.get("button").contains("Submit").click();
  }
}

export default FacilityPage;
