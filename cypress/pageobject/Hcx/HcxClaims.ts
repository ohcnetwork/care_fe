export class HcxClaims {
  selectEligiblePolicy(policy: string) {
    cy.clickAndSelectOption("#select-insurance-policy", policy);
  }

  verifyPolicyEligibity() {
    cy.verifyAndClickElement("#check-eligibity", "Check Eligibility");
  }
}
