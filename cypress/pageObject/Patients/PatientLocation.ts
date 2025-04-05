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
    addLocationButton: '[data-cy="add-location-button"]',
    sidebarContent: '[data-sidebar="content"]',
    locationTab: '[data-cy="settings-locations-tab"]',
    nameInput: '[data-cy="location-name-input"]',
    bedCountsSelect: '[data-cy="bed-counts-select"]',
    locationDescription: '[data-cy="location-description"]',
    locationStatus: '[data-cy="location-status"]',
    operationalStatus: '[data-cy="operational-status"]',
    enableBulkCreation: '[data-cy="enable-bulk-creation-checkbox"]',
    currentLocationBadge: '[data-cy="current-location-badge"]',
    addLocationBadge: '[data-cy="add-encounter-location"]',
    updateLocationButton: '[data-cy="update-encounter-location-button"]',
    endDateInput: '[data-cy="location-end-date-time"]',
    associatedLocationStatus: '[data-cy="associated-location-status"]',
    saveStatusButton: '[data-cy="update-associated-location-status-button"]',
    locationSearchTrigger: '[data-cy="location-search-trigger"]',
    submitLocationAssociation:
      '[data-cy="submit-encounter-location-association"]',
  };

  // Navigation
  navigateToSettings() {
    cy.verifyAndClickElement(this.selectors.sidebarContent, "Settings");
    return this;
  }

  clickLocationTab() {
    cy.verifyAndClickElement(this.selectors.locationTab, "Location");
    return this;
  }

  clickAddLocation() {
    cy.verifyAndClickElement(this.selectors.addLocationButton, "Add Location");
    return this;
  }

  selectLocationForm(locationForm: string) {
    if (locationForm) {
      cy.clickAndSelectOption(this.selectors.locationForm, locationForm);
    }
    return this;
  }

  enterLocationName(name: string, clearBeforeTyping: boolean = false) {
    cy.typeIntoField(this.selectors.nameInput, name, { clearBeforeTyping });
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

  navigateToEncounters() {
    cy.get('[data-sidebar="content"]').contains("Encounters").click();
    return this;
  }

  clickPlannedEncounterFilter() {
    cy.intercept("GET", "**/api/v1/encounter/**").as("getEncounters");
    cy.verifyAndClickElement('[data-cy="planned-filter"]', "Planned");
    cy.wait("@getEncounters", { timeout: 10000 }).then((interception) => {
      expect(interception.request.url).to.include("status=planned");
      expect(interception.response.statusCode).to.eq(200);
    });
    return this;
  }

  openFirstEncounterDetails() {
    cy.get('[data-cy="encounter-list-cards"]')
      .first()
      .contains("View Details")
      .click();
    return this;
  }

  clickAssociatedLocationBadge() {
    cy.get(this.selectors.currentLocationBadge).click();
    return this;
  }

  clickAddLocationBadge() {
    cy.get(this.selectors.addLocationBadge).click();
    return this;
  }

  clickUpdateLocationButton() {
    cy.verifyAndClickElement(
      this.selectors.updateLocationButton,
      "Update Location",
    );
    return this;
  }

  searchBedLocation(locationName: string) {
    cy.typeAndSelectOption(this.selectors.locationSearchTrigger, locationName);
    return this;
  }

  submitLocationAssociation() {
    cy.verifyAndClickElement(
      this.selectors.submitLocationAssociation,
      "Create Location Association",
    );
    return this;
  }

  setStatusCompleted() {
    cy.clickAndSelectOption(
      this.selectors.associatedLocationStatus,
      "Completed",
    );
    return this;
  }

  fillEndTime(dateTime: string) {
    cy.typeIntoField(this.selectors.endDateInput, dateTime, {
      clearBeforeTyping: true,
    });
    return this;
  }

  interceptLocationUpdationRequest() {
    cy.intercept("PUT", `**/api/v1/facility/**`).as("updateLocation");
    return this;
  }

  clickSaveStatusButton() {
    cy.verifyAndClickElement(this.selectors.saveStatusButton, "Save");
    return this;
  }

  verifyLocationUpdateAPICall() {
    cy.wait("@updateLocation").its("response.statusCode").should("eq", 200);
    return this;
  }

  verifyLocationAssociationFailAPICall() {
    cy.wait("@createLocation").its("response.statusCode").should("eq", 400);
    return this;
  }

  assertLocationStatusUpdateSuccess() {
    this.verifyLocationUpdateAPICall();
    cy.verifyNotification("Location association updated successfully");
    return this;
  }

  assertLocationAssociationSuccess() {
    this.verifyLocationCreationAPICall();
    cy.verifyNotification("Location association created successfully");
    return this;
  }
}
