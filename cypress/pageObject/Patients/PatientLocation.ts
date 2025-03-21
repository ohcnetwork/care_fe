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

  //\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\

  openFirstEncounterDetails() {
    cy.get('[data-cy="encounter-list-cards"]')
      .first()
      .contains("View Details")
      .click();
    return this;
  }

  clickUpdateEncounter() {
    cy.verifyAndClickElement(
      '[data-cy="update-encounter-option"]',
      "Update Encounter",
    );
    return this;
  }

  verifyEncounterPatientInfo(contents: string[]) {
    cy.verifyContentPresence("#patient-infobadges", contents);
    return this;
  }

  // Questionnaire actions
  addQuestionnaire(questionnaireName: string) {
    cy.typeAndSelectOption(
      '[data-cy="add-questionnaire-button"]',
      questionnaireName,
      false,
    );
    return this;
  }

  fillQuestionnaire(answers: Record<string, string>) {
    Object.entries(answers).forEach(([field, value]) => {
      // Handle both text inputs and select dropdowns
      cy.get(`[data-cy="question-${field}"]`).then(($el) => {
        if ($el.is("select")) {
          cy.wrap($el).select(value);
        } else {
          cy.wrap($el).type(value);
        }
      });
    });
    return this;
  }

  submitQuestionnaire() {
    this.clickSubmitQuestionnaire();
    this.verifyQuestionnaireSubmission();
    return this;
  }

  clickSubmitQuestionnaire() {
    cy.clickSubmitButton("Submit");
    return this;
  }

  verifyQuestionnaireSubmission() {
    cy.verifyNotification("Questionnaire submitted successfully");
    return this;
  }

  verifyOverviewValues(expectedValues: string[]) {
    cy.verifyContentPresence('[data-cy="encounter-overview"]', expectedValues);
    return this;
  }

  clickPatientDetailsButton() {
    cy.get('[data-cy="patient-details-button"]')
      .filter(":visible")
      .first()
      .click();
    return this;
  }

  clickPatientEditButton() {
    cy.verifyAndClickElement('[data-cy="edit-patient-button"]', "Edit");
    return this;
  }

  clickLocationAsComplete() {
    cy.verifyAndClickElement(
      '[data-cy="confirm-location-complete"]',
      "Completed",
    );
    return this;
  }

  assertLocationCreatedSuccess() {
    cy.verifyNotification("Location Created");
    return this;
  }

  clickInProgressEncounterFilter() {
    cy.intercept("GET", "**/api/v1/encounter/**").as("getEncounters");
    cy.verifyAndClickElement('[data-cy="in-progress-filter"]', "In Progress");
    cy.wait("@getEncounters", { timeout: 10000 }).then((interception) => {
      expect(interception.request.url).to.include("status=in_progress");
      expect(interception.response.statusCode).to.eq(200);
    });
    return this;
  }
}
