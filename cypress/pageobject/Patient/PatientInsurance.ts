class PatientInsurance {
  typePatientInsuranceDetail(
    containerId: string,
    fieldId: string,
    value: string
  ) {
    cy.get(`#${containerId}`).within(() => {
      cy.get(`#${fieldId}`).click().type(value);
    });
  }

  clickPatientInsuranceViewDetail() {
    cy.get("#insurance-view-details").scrollIntoView();
    cy.get("#insurance-view-details").click();
  }

  clickAddInsruanceDetails() {
    cy.get("[data-testid=add-insurance-button]").click();
  }

  verifyPatientPolicyDetails(subscriberId, policyId, insurerId, insurerName) {
    cy.get("[data-testid=patient-details]").then(($dashboard) => {
      cy.url().should("include", "/facility/");
      expect($dashboard).to.contain(subscriberId);
      expect($dashboard).to.contain(policyId);
      expect($dashboard).to.contain(insurerId);
      expect($dashboard).to.contain(insurerName);
    });
  }
}

export default PatientInsurance;
