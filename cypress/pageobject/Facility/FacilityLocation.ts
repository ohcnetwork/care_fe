class FacilityLocation {
  clickAddNewLocationButton() {
    cy.get("#add-new-location").click();
  }

  clickEditLocationButton() {
    cy.get("#edit-location-button").click();
  }

  clickEditBedButton() {
    cy.get("#edit-bed-button").click();
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

  clickManageBedButton() {
    cy.get("#manage-bed-button").first().click();
  }

  clickAddBedButton() {
    cy.get("#add-new-bed").click();
  }

  enterBedName(name: string) {
    cy.get("#bed-name").clear().click().type(name);
  }

  enterBedDescription(description: string) {
    cy.get("#bed-description").clear().click().type(description);
  }

  selectBedType(type: string) {
    cy.get("#bed-type").click();
    cy.get("li[role=option]").contains(type).click();
  }

  setMultipleBeds(numberOfBeds: number) {
    if (numberOfBeds > 1) {
      cy.get("#multiplebed-checkbox").click();
      cy.get("#numberofbed")
        .click()
        .clear()
        .click()
        .type(numberOfBeds.toString());
    }
  }

  verifyBedBadge(badge: string) {
    cy.get("#view-bedbadges").contains(badge);
  }

  verifyBedNameBadge(name: string) {
    cy.get("#view-bed-name").contains(name);
  }

  verifyIndividualBedName(baseName: string, totalBeds: number) {
    for (let i = 1; i <= totalBeds; i++) {
      const expectedName = `${baseName} ${i}`;
      cy.get("p#view-bed-name.inline.break-words.text-xl.capitalize")
        .should("be.visible")
        .contains(expectedName);
    }
  }

  deleteFirstBed() {
    cy.get("#delete-bed-button").first().click();
  }

  deleteBedRequest() {
    cy.intercept("DELETE", "**/api/v1/bed/**").as("deleteRequest");
  }

  deleteBedResponse() {
    cy.wait("@deleteRequest").its("response.statusCode").should("eq", 204);
  }
}

export default FacilityLocation;
