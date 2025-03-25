export class PatientEncounter {
  // Navigation
  navigateToEncounters() {
    cy.get('[data-sidebar="content"]').contains("Encounters").click();
    return this;
  }

  openFirstEncounterDetails() {
    cy.get('[data-cy="encounter-list-cards"]')
      .first()
      .contains("View Details")
      .click();
    return this;
  }
  openOngoingEncounter() {
    cy.get('[data-cy="in-progress-filter"]').click();
    cy.get('[data-cy="encounter-list-cards"]')
      .first()
      .contains("View Details")
      .click();
    return this;
  }

  clickMedicinesTab() {
    cy.verifyAndClickElement('[data-cy="tab-medicines"]', "Medicines");
    return this;
  }
  clickEditPrescription() {
    cy.verifyAndClickElement('[data-cy="edit-prescription"]', "Edit");
    return this;
  }
  addMedication(
    medicineName,
    dosage,
    dosageInput,
    frequency,
    instructions,
    route,
    site,
    method,
    notes,
  ) {
    cy.clickAndSelectOption(
      '[data-cy="question-medication-request"]',
      medicineName,
    );
    cy.get('[data-cy="dosage"]').click().type(dosage);
    cy.clickAndSelectOption('[data-cy="dosage"]', dosageInput);
    cy.clickAndSelectOption('[data-cy="frequency"]', frequency);
    cy.clickAndSelectOption('[data-cy="instructions"]', instructions);
    cy.clickAndSelectOption('[data-cy="route"]', route);
    cy.clickAndSelectOption('[data-cy="site"]', site);
    cy.clickAndSelectOption('[data-cy="method"]', method);
    cy.get('[data-cy="notes"]').click();
    cy.get('[data-cy="notes-textarea"]').type(notes);
    return this;
  }
  verifyMedication(
    medicineName,
    dosage,
    frequency,
    instructions,
    route,
    site,
    method,
    notes,
  ) {
    cy.get('[data-cy="medications-table"]').within(() => {
      cy.contains("td", medicineName).should("exist");
      cy.contains("td", dosage).should("exist");
      cy.contains("td", frequency).should("exist");
      cy.contains("td", instructions).should("exist");
      cy.contains("td", route).should("exist");
      cy.contains("td", site).should("exist");
      cy.contains("td", method).should("exist");
      cy.contains("td", notes).should("exist");
    });
    return this;
  }
  removeMedication() {
    cy.get('[data-cy="remove-medication"]').first().click();
    cy.verifyAndClickElement('[data-cy="confirm-remove-medication"]', "Remove");
    return this;
  }
  verifyDeletedMedication(
    medicineName,
    dosage,
    frequency,
    instructions,
    route,
    site,
    method,
    notes,
  ) {
    cy.get('[data-cy="toggle-stopped-medications"]').click();
    cy.get('[data-cy="medications-table"]').within(() => {
      cy.contains("td", medicineName).should("exist");
      cy.contains("td", dosage).should("exist");
      cy.contains("td", frequency).should("exist");
      cy.contains("td", instructions).should("exist");
      cy.contains("td", route).should("exist");
      cy.contains("td", site).should("exist");
      cy.contains("td", method).should("exist");
      cy.contains("td", notes).should("exist");
    });
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

  clickEncounterMarkAsComplete() {
    cy.verifyAndClickElement(
      '[data-cy="mark-encounter-complete"]',
      "Mark as Complete",
    );
    return this;
  }

  clickConfirmEncounterAsComplete() {
    cy.intercept("GET", "**/api/v1/encounter/**").as("getEncounter");
    cy.verifyAndClickElement(
      '[data-cy="confirm-encounter-complete"]',
      "Mark as Complete",
    );
    cy.wait("@getEncounter").then((interception) => {
      expect(interception.response?.statusCode).to.eq(200); // Verify status code
      expect(interception.response?.body).to.have.property(
        "status",
        "completed",
      );
    });
    return this;
  }

  assertEncounterCompleteSuccess() {
    cy.verifyNotification("Encounter Complete");
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
