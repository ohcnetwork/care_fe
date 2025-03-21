export interface LocationData {
  form: string;
  name: string;
  beds_count?: number;
  description?: string;
  status: "Active" | "Inactive" | "Unknown";
  op_status: string;
}

export class PatientLocation {
  private selectors = {
    locationForm: '[data-cy="location-form-options"]',
    addLocationButton: '[data-cy="add-location-button"]',
  };

  // Navigation
  navigateToSettings() {
    cy.get('[data-sidebar="content"]').contains("Settings").click();
    return this;
  }

  clickLocationTab() {
    cy.get('[data-cy="settings-location-tab"]').contains("Location").click();
    return this;
  }

  clickAddLocation() {
    cy.verifyAndClickElement(this.selectors.addLocationButton, "Add Location");
    return this;
  }

  selectLocationFormOption(locationForm: string) {
    cy.clickAndSelectOption(this.selectors.locationForm, locationForm);
    return this;
  }
}
