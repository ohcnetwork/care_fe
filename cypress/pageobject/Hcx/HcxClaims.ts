export class HcxClaims {
  selectEligiblePolicy(policy: string) {
    cy.clickAndSelectOption("#select-insurance-policy", policy);
  }

  verifyPolicyEligibility() {
    cy.verifyAndClickElement("#check-eligibility", "Check Eligibility");
  }
}
