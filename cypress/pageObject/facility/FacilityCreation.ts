export class FacilityCreation {
  // Navigation
  navigateToOrganization(orgName: string) {
    cy.verifyAndClickElement('[data-cy="organization-list"]', orgName);
  }

  navigateToFacilitiesList() {
    cy.verifyAndClickElement(
      '[data-testid="org-nav-facilities"]',
      "Facilities",
    );
  }

  clickAddFacility() {
    cy.get('[data-cy="add-facility-button"]').should("be.visible").click();
  }

  // Individual field methods
  enterFacilityName(name: string) {
    cy.get('[data-cy="facility-name"]').type(name);
  }

  selectFacilityType(facilityType: string) {
    cy.clickAndSelectOption('[data-cy="facility-type"]', facilityType);
  }

  enterDescription(description: string) {
    cy.get('[data-cy="facility-description"]').type(description);
  }

  enterPhoneNumber(phone: string) {
    cy.get('[data-cy="facility-phone"]').type(phone);
  }

  enterPincode(pincode: string) {
    cy.get('[data-cy="facility-pincode"]').type(pincode);
  }

  enterAddress(address: string) {
    cy.get('[data-cy="facility-address"]').type(address);
  }

  enterLatitude(latitude: string) {
    cy.get('[data-cy="facility-latitude"]').type(latitude);
  }

  enterLongitude(longitude: string) {
    cy.get('[data-cy="facility-longitude"]').type(longitude);
  }

  // Combined methods using individual functions
  fillBasicDetails(name: string, facilityType: string, description: string) {
    this.enterFacilityName(name);
    this.selectFacilityType(facilityType);
    this.enterDescription(description);
  }

  selectFeatures(features: string[]) {
    cy.clickAndMultiSelectOption("#facility-features", features);
  }

  fillContactDetails(phone: string, pincode: string, address: string) {
    this.enterPhoneNumber(phone);
    this.enterPincode(pincode);
    this.enterAddress(address);
  }

  fillLocationDetails(latitude: string, longitude: string) {
    this.enterLatitude(latitude);
    this.enterLongitude(longitude);
  }

  makePublicFacility() {
    cy.get('[data-cy="make-facility-public"]').click();
  }

  submitFacilityCreationForm() {
    cy.clickSubmitButton("Create Facility");
  }

  // Verification Methods
  verifySuccessMessage() {
    cy.verifyNotification("Facility created successfully");
  }

  verifyValidationErrors() {
    cy.verifyErrorMessages([
      "Name is required",
      "Facility type is required",
      "Address is required",
      "Phone number must start with +91 followed by 10 digits",
    ]);
  }

  searchFacility(facilityName: string) {
    cy.get('[data-cy="search-facility"]').type(facilityName);
  }

  verifyFacilityNameInCard(facilityName: string) {
    cy.get('[data-cy="facility-cards"]').should("contain", facilityName);
  }
}
