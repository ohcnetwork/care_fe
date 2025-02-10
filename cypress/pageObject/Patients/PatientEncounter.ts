export class PatientEncounter {
  // Navigation
  navigateToEncounters() {
    cy.get('[data-sidebar="content"]').contains("Encounters").click();
    return this;
  }

  openSettingsTab() {
    cy.get('[data-sidebar="content"]').contains("Settings").click();
    return this;
  }

  openFirstEncounterDetails() {
    cy.get('[data-cy="encounter-list-cards"]')
      .first()
      .contains("View Details")
      .click();
    return this;
  }

  clickUpdateEncounter() {
    cy.verifyAndClickElement('[data-cy="update-encounter-button"]', "Update");
    cy.verifyAndClickElement(
      '[data-cy="update-encounter-option"]',
      "Update Encounter",
    );
    return this;
  }


  openNotesTab() {
    cy.get('#encounter_tab_nav').contains("Notes").click();
    return this;
  }

  
  
  addMessageToThread(message: string) {
    cy.get('textarea[placeholder="Type your message"]').type(message);
    // Click the submit button
    cy.get('button[type="submit"]').click();
  }

  verifyEncounterPatientInfo(contents: string[]) {
    cy.verifyContentPresence("#patient-infobadges", contents);
    return this;
  }

  startNewConversation() {
    cy.contains("button", "Start New Discussion").should("be.visible").click();
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
    cy.verifyAndClickElement(
      '[data-cy="patient-details-button"]',
      "Patient Details",
    );
    return this;
  }

  clickPatientEditButton() {
    cy.verifyAndClickElement('[data-cy="edit-patient-button"]', "Edit");
    return this;
  }
}
