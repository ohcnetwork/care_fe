export class Questionnaire {
  // ... existing methods ...

  clickAdminDashboard() {
    cy.verifyAndClickElement(
      '[data-cy="admin-dashboard-button"]',
      "Admin Dashboard",
    );
    return this;
  }

  searchQuestionnaire(value: string) {
    cy.typeIntoField('[data-cy="questionnaire-search"]', value);
    return this;
  }

  clickFirstQuestionnaireView() {
    cy.get('[data-cy="questionnaire-view"]').first().click({ force: true });
    return this;
  }

  clickRetiredStatus() {
    cy.get("#status-retired").click({ force: true });
    return this;
  }

  clickDraftStatus() {
    cy.get("#status-draft").click({ force: true });
    return this;
  }

  clickActiveStatus() {
    cy.get("#status-active").click({ force: true });
    return this;
  }

  saveQuestionnaire() {
    cy.verifyAndClickElement('[data-cy="save-questionnaire-form"]', "Save");
    return this;
  }

  verifyQuestionnaireUpdate() {
    cy.verifyNotification("Questionnaire updated successfully");
    return this;
  }

  verifyQuestionnaireNotPresent(questionnaireName: string) {
    cy.typeAndVerifyOptionNotPresent(
      '[data-cy="add-questionnaire-button"]',
      questionnaireName,
      "No questionnaires found",
    );
    return this;
  }
}
