class PatientInsurance {
  typePatientInsuranceDetail(
    containerId: string,
    fieldId: string,
    value: string,
  ) {
    cy.get(`#${containerId}`).within(() => {
      cy.get(`#${fieldId}`).click().type(value);
    });
  }

  selectInsurer(insurer: string) {
    cy.intercept("GET", "**/api/v1/hcx/payors/**", {
      statusCode: 200,
      body: [
        {
          name: "test payor 2",
          code: "testpayor2.swasthmock@swasth-hcx-staging",
        },
        {
          name: "Care Payor",
          code: "khavinshankar.gmail@swasth-hcx-staging",
        },
        {
          name: "Alliance",
          code: "hcxdemo.yopmail@swasth-hcx-staging",
        },
      ],
    }).as("getInsurer");
    cy.get("[name='insurer']")
      .last()
      .click()
      .type(insurer)
      .then(() => {
        cy.wait("@getInsurer");
        cy.get("[role='option']").contains(insurer).click();
      });
  }

  clickPatientInsuranceViewDetail() {
    cy.get("#insurance-view-details").scrollIntoView();
    cy.get("#insurance-view-details").click();
  }

  clickAddInsruanceDetails() {
    cy.get("[data-testid=add-insurance-button]").click();
  }

  verifyPatientPolicyDetails(
    subscriberId: string,
    policyId: string,
    insurerId: string,
    insurerName: string,
    isHcxEnabled: string,
  ) {
    cy.get("[data-testid=patient-details]").then(($dashboard) => {
      cy.url().should("include", "/facility/");
      expect($dashboard).to.contain(subscriberId);
      expect($dashboard).to.contain(policyId);
      if (!isHcxEnabled) {
        expect($dashboard).to.contain(insurerId);
        expect($dashboard).to.contain(insurerName);
      }
    });
  }
}

export default PatientInsurance;
