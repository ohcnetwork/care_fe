class PatientInvestigation {
  clickAddInvestigation() {
    cy.get("#investigation").scrollIntoView();
    cy.verifyAndClickElement("#investigation", "Add Investigation");
  }

  clickInvestigationTab() {
    cy.get("#consultation_tab_nav").scrollIntoView();
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

  selectInvestigationFrequency(frequency: string) {
    cy.get("#investigation-frequency").click();
    cy.contains("button", frequency).should("be.visible").click();
  }
}
export default PatientInvestigation;
