class PatientInsurance {
  typeSubscriberId(id: string, subscriberId: string) {
    cy.get(`#${id}`).within(() => {
      cy.get("#subscriber_id").clear().type(subscriberId);
    });
  }

  typePolicyId(id: string, policyid: string) {
    cy.get(`#${id}`).within(() => {
      cy.get("#policy_id").click().type(policyid);
    });
  }

  typeInsurerId(id: string, insurerid: string) {
    cy.get(`#${id}`).within(() => {
      cy.get("#insurer_id").click().type(insurerid);
    });
  }

  typeInsurerName(id: string, insurername: string) {
    cy.get(`#${id}`).within(() => {
      cy.get("#insurer_name").click().type(insurername);
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
