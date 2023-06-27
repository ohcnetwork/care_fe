// FacilityPage.ts
class FacilityPage {
  visitCreateFacilityPage() {
    cy.visit("/facility/create");
  }

  visitUpdateFacilityPage(url: string) {
    cy.visit(url);
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
    cy.get("#manage-facility-dropdown").click();
  }

  clickUpdateFacilityOption() {
    cy.get("#update-facility").contains("Update Facility").click();
  }

  selectLocation(location: string) {
    cy.get("span > svg.care-svg-icon__baseline.care-l-map-marker").click();
    cy.intercept("https://maps.googleapis.com/maps/api/mapsjs/*").as("mapApi");
    cy.wait("@mapApi").its("response.statusCode").should("eq", 200);
    cy.get("input#pac-input").type(location).type("{enter}");
    cy.get("div#map-close").click();
  }
}

export default FacilityPage;
