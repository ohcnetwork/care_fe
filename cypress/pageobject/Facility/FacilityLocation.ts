import FacilityPage from "./FacilityCreation";
import FacilityHome from "./FacilityHome";

const facilityHome = new FacilityHome();
const facilityPage = new FacilityPage();

class FacilityLocation {
  navigateToFacilityLocationManagement(facilityName: string) {
    facilityHome.typeFacilitySearch(facilityName);
    facilityHome.assertFacilityInCard(facilityName);
    facilityHome.clickViewFacilityDetails();
    facilityPage.clickManageFacilityDropdown();
    this.clickFacilityLocationManagement();
  }

  clickAddNewLocationButton() {
    cy.get("#add-new-location").click();
  }

  typeLocationName(locationName: string) {
    cy.get("#location-name").type(locationName);
  }

  clickFacilityLocationManagement() {
    cy.get("[id=location-management]").click();
  }

  clickAddLocationButton() {
    cy.clickSubmitButton("Add Location");
  }

  clickEditLocationButton() {
    cy.get("#edit-location-button").click();
  }

  clickEditBedButton(cardText: string) {
    cy.get("#bed-cards")
      .contains(cardText)
      .parents("#bed-cards")
      .within(() => {
        cy.get("#edit-bed-button").click();
      });
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

  verifyLocationDescription(description: string) {
    cy.get("#view-location-description").contains(description);
  }

  verifyLocationMiddleware(middleware: string) {
    cy.get("#view-location-middleware").contains(middleware);
  }

  clickManageBedButton(cardText: string) {
    cy.get("#location-cards")
      .contains(cardText)
      .parents("#location-cards")
      .within(() => {
        cy.verifyAndClickElement("#manage-bed-button", "Manage Beds");
      });
  }

  clickAddBedButton() {
    cy.verifyAndClickElement("#add-new-bed", "Add New Bed(s)");
  }

  clickSubmitBedsButton() {
    cy.clickSubmitButton("Add Bed(s)");
  }

  closeAddLocationForm() {
    cy.clickCancelButton("Cancel");
  }

  verifyAddLocationSuccessfulMesssage() {
    cy.verifyNotification("Location created successfully");
    cy.closeNotification();
  }

  verifyEditBedSuccessfulMessage() {
    cy.verifyNotification("Bed updated successfully");
    cy.closeNotification();
  }

  verifyEditLocationSuccessfulMessage() {
    cy.verifyNotification("Location updated successfully");
    cy.closeNotification();
  }

  verifyAddSingleBedSuccessfulMesssage() {
    cy.verifyNotification("1 Bed created successfully");
    cy.closeNotification();
  }

  enterBedName(name: string) {
    cy.get("#bed-name").click().clear().click().type(name);
  }

  enterBedDescription(description: string) {
    cy.get("#bed-description").clear().click().type(description);
  }

  clickUpdateBedButton() {
    cy.clickSubmitButton("Update Bed");
  }

  clickUpdateLocationButton() {
    cy.clickSubmitButton("Update Location");
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

  clickDeleteLocation() {
    cy.verifyAndClickElement("#delete-location-button", "Delete");
  }

  deleteBedWithName(text: string) {
    cy.get("#bed-card")
      .contains(text)
      .parents("#bed-card")
      .within(() => {
        cy.get("#delete-bed-button").click();
      });
  }

  deleteBedRequest() {
    cy.intercept("DELETE", "**/api/v1/bed/**").as("deleteRequest");
  }

  deleteBedResponse() {
    cy.wait("@deleteRequest").its("response.statusCode").should("eq", 204);
  }
}

export default FacilityLocation;
