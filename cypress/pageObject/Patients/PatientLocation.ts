export interface LocationData {
  form: string;
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
  };

  // Navigation
  navigateToSettings() {
    cy.get('[data-sidebar="content"]').contains("Settings").click();
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
    cy.clickAndSelectOption(this.selectors.locationForm, locationForm);
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
}
