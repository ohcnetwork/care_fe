export interface LocationData {
  form: string;
  name: string;
  bedsCount?: string;
  description?: string;
  status: "Active" | "Inactive" | "Unknown";
  opStatus: string;
}

export class PatientLocation {
  private selectors = {
    locationForm: '[data-cy="location-form-options"]',
    addLocationButton: '[data-cy="add-location-button"]',
    sidebarContent: '[data-sidebar="content"]',
    locationTab: '[data-cy="settings-location-tab"]',
    nameInput: '[data-cy="location-name-input"]',
    bedCountsSelect: '[data-cy="bed-counts-select"]',
    locationDescription: '[data-cy="location-description"]',
    locationStatus: '[data-cy="location-status"]',
    operationalStatus: '[data-cy="operational-status"]',
  };

  // Navigation
  navigateToSettings() {
    cy.get(this.selectors.sidebarContent).contains("Settings").click();
    return this;
  }

  clickLocationTab() {
    cy.get(this.selectors.locationTab).contains("Location").click();
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
      .selectBedCounts(data.bedsCount)
      .enterDescription(data.description)
      .selectLocationStatus(data.status)
      .selectOperationalStatus(data.opStatus);
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
