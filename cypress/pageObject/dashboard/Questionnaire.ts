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
    cy.get("#status-retired").click();
    return this;
  }

  clickDraftStatus() {
    cy.get("#status-draft").click();
    return this;
  }

  clickActiveStatus() {
    cy.get("#status-active").click();
    return this;
  }

  saveQuestionnaire() {
    cy.verifyAndClickElement('[data-cy="save-questionnaire-form"]', "Save");
    return this;
  }

  verifyQuestionnaireUpdate() {
    cy.get("li[data-sonner-toast]", { timeout: 10000 })
      .should("be.visible")
      .find("div[data-title]")
      .invoke("text")
      .then((text) => {
        if (text.includes("Questionnaire updated successfully")) {
          cy.verifyNotification("Questionnaire updated successfully");
        } else if (text.includes("No changes made")) {
          cy.verifyNotification("No changes made");
        }
      });
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
