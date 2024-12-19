export class HcxClaims {
  selectEligiblePolicy(policy: string) {
    cy.get("#select-insurance-policy", { timeout: 10000 })
      .should("be.visible")
      .and("not.be.disabled");
    cy.clickAndSelectOption("#select-insurance-policy", policy, true);
  }

  verifyPolicyEligibility() {
    cy.verifyAndClickElement("#check-eligibility", "Check Eligibility");
  }
}
