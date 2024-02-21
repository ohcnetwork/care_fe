class PatientInvestigation {
  clickAddInvestigation() {
    cy.get("#investigation").scrollIntoView();
    cy.verifyAndClickElement("#investigation", "Add Investigation");
  }

  clickInvestigationTab() {
    cy.get("#consultation_tab_nav").scrollIntoView();
    cy.get("#consultation_tab_nav").contains("Investigations").click();
  }

  selectInvestigation(investigation: string) {
    cy.get("#search-patient-investigation").click();
    cy.get("#investigation-group").contains(investigation).click();
    cy.get("#investigation").contains("Investigation No. 1").click();
  }

  clickInvestigationCheckbox() {
    cy.get("#investigation-checkbox").click();
  }

  selectInvestigationFrequency(frequency: string) {
    cy.get("#investigation-frequency").click();
    cy.contains("button", frequency).should("be.visible").click();
  }
}
export default PatientInvestigation;
