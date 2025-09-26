export interface LocationData {
  form?: string;
  name: string;
  bedsCount?: string;
  description?: string;
  status?: "Active" | "Inactive" | "Unknown";
  opStatus?: string;
}

export class PatientLocation {
  private selectors = {
    locationForm: '[data-cy="location-form-options"]',
    addChildLocationButton: '[data-cy="add-child-location-button"]',
    nameInput: '[data-cy="location-name-input"]',
    bedCountsSelect: '[data-cy="bed-counts-select"]',
    locationDescription: '[data-cy="location-description"]',
    locationStatus: '[data-cy="location-status"]',
    operationalStatus: '[data-cy="operational-status"]',
    enableBulkCreation: '[data-cy="enable-bulk-creation-checkbox"]',
    currentLocationBadge: '[data-cy="current-location-badge"]',
    addLocationBadge: '[data-cy="add-encounter-location"]',
    updateLocationButton: '[data-cy="update-encounter-location-button"]',
    locationList: '[data-cy="location-assign-screen"]',
    submitLocationAssociation: '[data-cy="location-navigation-buttons"]',
    saveBedButton: '[data-cy="location-card-wrapper-save-button"]',
    completeBedStayButton: '[data-cy="complete-bed-stay-button"]',
    locationCard: '[data-cy="location-card-container"]',
    locationSearchInput: '[data-cy="location-search-input"]',
    viewDetailsLocationButton: '[data-cy="view-location-row"]',
    locationChildSearchInput: '[data-cy="location-child-search-input"]',
    deleteLocationButton: '[data-cy="delete-location-button"]',
    removeLocationButton: '[data-cy="remove-location-button"]',
    showAvailableBeds: "#available-only",
  };

  openFirstExistingLocation() {
    cy.get(this.selectors.viewDetailsLocationButton).first().click({
      force: true,
    });
    return this;
  }

  clickFirstDeleteLocationButton() {
    cy.get(this.selectors.deleteLocationButton).first().click({ force: true });
    cy.clickConfirmAction("Remove");
    return this;
  }

  interceptLocationDeletionAPICall() {
    cy.intercept("DELETE", `**/api/v1/facility/**`).as("deleteLocation");
    return this;
  }

  verifyLocationDeletionAPICall() {
    cy.wait("@deleteLocation").then((interception) => {
      expect(interception.response?.statusCode).to.eq(204);
    });
    return this;
  }

  assertLocationDeletionSuccess() {
    cy.verifyNotification("Location removed successfully");
    return this;
  }

  searchLocation(locationName: string) {
    cy.typeIntoField(this.selectors.locationSearchInput, locationName, {
      skipVerification: true,
    });
    return this;
  }

  searchChildLocation(locationName: string) {
    cy.typeIntoField(this.selectors.locationChildSearchInput, locationName, {
      skipVerification: true,
      clearBeforeTyping: true,
    });
    return this;
  }

  // Navigation
  navigateToSettings() {
    cy.verifyAndClickElement('[data-cy="nav-settings"]', "Settings");
    return this;
  }

  clickLocationTab() {
    cy.verifyAndClickElement('[data-cy="nav-locations"]', "Location");
    return this;
  }

  clickChildAddLocation() {
    cy.verifyAndClickElement(
      this.selectors.addChildLocationButton,
      "Add Location",
    );
    return this;
  }

  selectLocationForm(locationForm: string) {
    if (locationForm) {
      cy.clickAndSelectOption(this.selectors.locationForm, locationForm);
    }
    return this;
  }

  enterLocationName(name: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField(this.selectors.nameInput, name, {
      clearBeforeTyping,
      skipVerification: true,
    });
    return this;
  }

  enableBulkCreation(enableBulkCreation: boolean) {
    if (enableBulkCreation) {
      cy.get(this.selectors.enableBulkCreation).click();
    }
    return this;
  }

  selectBedCounts(bedCounts: string) {
    if (bedCounts) {
      cy.clickAndSelectOption(this.selectors.bedCountsSelect, bedCounts);
    }
    return this;
  }

  enterDescription(description: string) {
    if (description) {
      cy.typeIntoField(this.selectors.locationDescription, description);
    }
    return this;
  }

  selectLocationStatus(status: string) {
    if (status) {
      cy.clickAndSelectOption(this.selectors.locationStatus, status);
    }
    return this;
  }

  selectOperationalStatus(status: string) {
    if (status) {
      cy.clickAndSelectOption(this.selectors.operationalStatus, status);
    }
    return this;
  }

  fillLocationData(data: LocationData) {
    this.selectLocationForm(data.form)
      .enterLocationName(data.name)
      .enableBulkCreation(data.form === "Bed")
      .selectBedCounts(data.bedsCount)
      .enterDescription(data.description)
      .selectLocationStatus(data.status)
      .selectOperationalStatus(data.opStatus);
    return this;
  }

  interceptLocationCreationRequest() {
    cy.intercept("POST", `**/api/v1/facility/**`).as("createLocation");
    return this;
  }

  verifyLocationCreationAPICall() {
    cy.wait("@createLocation").its("response.statusCode").should("eq", 200);
    return this;
  }

  submitLocationForm() {
    cy.clickSubmitButton("Create");
    return this;
  }

  assertLocationCreationSuccess() {
    cy.verifyNotification("Location Created");
    return this;
  }

  assertMultipleBedsCreationSuccess(bedCount: string) {
    cy.verifyNotification(`${bedCount} created successfully`);
    return this;
  }

  clickAssociatedLocationBadge() {
    cy.get(this.selectors.currentLocationBadge).click();
    return this;
  }

  clickAddLocationBadge() {
    cy.verifyAndClickElement(this.selectors.addLocationBadge, "Add Location");
    return this;
  }

  clickUpdateLocationButton() {
    cy.verifyAndClickElement(
      this.selectors.updateLocationButton,
      "Update Location",
    );
    return this;
  }

  selectLocationBuilding(locationName: string) {
    cy.verifyAndClickElement(this.selectors.locationList, locationName);
    return this;
  }

  selectLocationBed(locationName: string) {
    cy.verifyAndClickElement(this.selectors.locationList, locationName);
    return this;
  }

  clickShowAvailableBeds() {
    cy.get(this.selectors.showAvailableBeds).click();
    return this;
  }

  clickAssignBedButton() {
    cy.verifyAndClickElement(
      this.selectors.submitLocationAssociation,
      "Assign Bed Now",
    );
    return this;
  }

  assertLocationCompletedSuccess() {
    cy.verifyNotification("Bed Assigned Successfully");
    return this;
  }

  assertLocationAssociationSuccess() {
    cy.verifyNotification("Bed Assigned Successfully");
    return this;
  }

  clickSaveBedButton() {
    cy.verifyAndClickElement(this.selectors.saveBedButton, "Save");
    return this;
  }

  clickCompleteBedButton() {
    cy.verifyAndClickElement(this.selectors.saveBedButton, "Complete");
    return this;
  }

  clickCompleteBedStayButton() {
    cy.verifyAndClickElement(
      this.selectors.completeBedStayButton,
      "Complete Bed Stay",
    );
    return this;
  }
}
