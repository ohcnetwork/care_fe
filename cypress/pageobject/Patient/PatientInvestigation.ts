class PatientInvestigation {
  clickAddInvestigation() {
    cy.verifyAndClickElement("#investigation", "Add Investigation");
  }

  clickInvestigationTab() {
    cy.verifyAndClickElement("#consultation_tab_nav", "Investigations");
  }

  selectInvestigation(investigation: string) {
    cy.get("#search-patient-investigation").type(investigation);
    cy.verifyAndClickElement("#investigation-group", investigation);
    cy.verifyAndClickElement("#investigation", "Investigation No. 1");
  }

  clickInvestigationCheckbox() {
    cy.get("#investigation-checkbox").click();
  }

  selectInvestigationOption(options: string[]) {
    cy.clickAndMultiSelectOption("#investigations", options);
  }

  clickLogLabResults() {
    cy.verifyAndClickElement("#log-lab-results", "Log Lab Results");
  }

  selectInvestigationFrequency(frequency: string) {
    cy.get("#investigation-frequency").click();
    cy.contains("button", frequency).should("be.visible").click();
  }
}
export default PatientInvestigation;
