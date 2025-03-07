export class PatientEncounter {
  private routes = {};

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

  // Encounter Notes
  openEncounterNotesTab() {
    cy.get('[data-cy="encounter-notes-tab"]').click();
    return this;
  }

  clickNewThreadButton() {
    cy.get('[data-cy="new-thread-button"]').click();
    return this;
  }

  typeThreadTitle(title: string) {
    cy.get('[data-cy="new-thread-title-input"]').type(title);
    return this;
  }

  clickCreateThreadButton() {
    cy.get('[data-cy="create-thread-button"]').click();
    return this;
  }

  sendMessage(message: string) {
    cy.get('[data-cy="encounter-message-input"]')
      .should("be.visible")
      .should("not.be.disabled")
      .clear()
      .type(message);

    cy.get('[data-cy="send-chat-message-button"]')
      .should("be.visible")
      .should("not.be.disabled")
      .click();

    cy.wait("@sendMessage").its("response.statusCode").should("eq", 200);
    cy.contains(message).should("be.visible");
  }

  addNewChatMessages(singleLineMessage: string, multiLineMessage: string) {
    cy.intercept("POST", "/api/v1/patient/*/thread/*/note/").as("sendMessage");

    this.sendMessage(singleLineMessage);
    this.sendMessage(multiLineMessage);

    return this;
  }

  changeThread(title: string) {
    cy.contains('[data-cy="thread-title"]', title).should("be.visible").click();
    return this;
  }
}
