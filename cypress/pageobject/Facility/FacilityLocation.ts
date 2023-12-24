class FacilityLocation {
  clickAddNewLocationButton() {
    cy.get("#add-new-location").click();
  }

  clickEditLocationButton() {
    cy.get("#edit-location-button").click();
  }

  fillDescription(description: string) {
    cy.get("#description").clear().click().type(description);
  }

  selectLocationType(type: string) {
    cy.get("#location-type").click();
    cy.get("li[role=option]").contains(type).click();
  }

  fillMiddlewareAddress(address: string) {
    cy.get("#location-middleware-address").clear().click().type(address);
  }

  verifyLocationName(name: string) {
    cy.get("#view-location-name").contains(name);
  }

  verifyLocationType(type: string) {
    cy.get("#location-type").contains(type);
  }

  verifyLocationDescription(description: string) {
    cy.get("#view-location-description").contains(description);
  }

  verifyLocationMiddleware(middleware: string) {
    cy.get("#view-location-middleware").contains(middleware);
  }
}

export default FacilityLocation;
