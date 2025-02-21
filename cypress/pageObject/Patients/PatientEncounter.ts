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
    frequency,
    instructions,
    route,
    site,
    method,
    notes,
  ) {
    cy.get('[data-cy="question-medication-request"]').click();
    cy.get('[role="listbox"]')
      .find('[role="option"]')
      .contains(medicineName)
      .click();
    cy.get('input[inputmode="numeric"]').should("exist").type(dosage);
    cy.get('[data-cy="frequency"]').click();
    cy.get('[role="option"]').contains(frequency).click();
    cy.contains("Select additional instructions").click();
    cy.get('[role="listbox"]')
      .find('[role="option"]')
      .contains(instructions)
      .click();
    cy.contains("Select route").click();
    cy.get('[role="listbox"]').find('[role="option"]').contains(route).click();
    cy.contains("Select site").click();
    cy.get('[role="listbox"]').find('[role="option"]').contains(site).click();
    cy.contains("Select method").click();
    cy.get('[role="listbox"]').get('[role="option"]').contains(method).click();
    cy.get('[data-cy="notes"]').click();
    cy.get('[data-cy="notes-textarea"]').type(notes);

    this.clickSubmitQuestionnaire();
    this.verifyQuestionnaireSubmission();
    return this;
  }
  removeMedication() {
    cy.get('[data-cy="medication-remove"]').first().click();
    cy.verifyAndClickElement('[data-cy="confirm-remove-medication"]', "Remove");
    this.clickSubmitQuestionnaire();
    this.verifyQuestionnaireSubmission();
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
    cy.get('[data-cy="add-questionnaire-button"]').click();
    cy.get('[role="dialog"] input')
      .should("be.visible")
      .type(questionnaireName);
    cy.get('[role="dialog"] button')
      .contains(questionnaireName)
      .should("be.visible")
      .click();
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
}
