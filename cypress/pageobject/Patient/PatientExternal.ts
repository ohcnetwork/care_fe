class PatientExternal {
  verifyExternalListPatientName(patientName: string) {
    cy.get("#external-result-table").contains(patientName).click();
  }

  verifyExternalIdVisible() {
    cy.get("#patient-external-id").contains("Care external results ID");
  }

  clickImportFromExternalResultsButton() {
    cy.get("#import-externalresult-button").click();
  }

  typeCareExternalResultId(externalId) {
    cy.get("#care-external-results-id").scrollIntoView();
    cy.get("#care-external-results-id").should("be.visible");
    cy.get("#care-external-results-id").type(externalId);
  }

  clickImportPatientData() {
    cy.get("#submit-importexternalresult-button").click();
  }

  verifyExternalPatientName(patientName: string) {
    cy.get("#name", { timeout: 10000 }).should("have.value", patientName);
  }
}
export default PatientExternal;
