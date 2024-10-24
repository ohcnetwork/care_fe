class FacilityLocation {
  loadLocationManagementPage(name: string) {
    cy.awaitUrl("/");
    cy.intercept("GET", "**/api/v1/facility/**").as("getFacilities");
    cy.get("[id='facility-name-card']").contains(name).click();
    cy.wait("@getFacilities").its("response.statusCode").should("eq", 200);
    cy.get("h1.text-3xl.font-bold", { timeout: 10000 }).should("be.visible");
    cy.get("#manage-facility-dropdown button").should("be.visible");
    cy.get("[id='manage-facility-dropdown']").scrollIntoView().click();
    cy.get("[id=location-management]").click();
  }

  closeNotification() {
    cy.get(".pnotify")
      .should("exist")
      .each(($div) => {
        cy.wrap($div).click();
      });
  }

  clickAddNewLocationButton() {
    cy.get("#add-new-location").click();
  }

  clickFacilityLocationManagement() {
    cy.get("[id=location-management]").click();
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

  clickText(name: string) {
    cy.get("div").contains(name).click();
  }

  enterLocationName(name: string) {
    cy.get("input[id=name]").type(name);
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

  verifyNotification(message: string) {
    cy.get(".pnotify-container").should("contain", message).and("be.visible");
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

  clickNotification() {
    cy.get(".pnotify-container").click();
  }

  enterBedName(name: string) {
    cy.get("#bed-name").click().clear().click().type(name);
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

  clickManageBeds() {
    cy.get("#manage-beds").click();
  }

  clickManageAssets() {
    cy.get("#manage-assets").click();
  }

  deleteLocation(name: string) {
    cy.contains("div", name)
      .should("exist")
      .then(($div) => {
        $div.parents("div").eq(2).find("button#delete-location-button").click();
      });
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
