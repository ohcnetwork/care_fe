export class FacilityHomepage {
  navigateToSettings() {
    cy.verifyAndClickElement('[data-sidebar="content"]', "Settings");
    return this;
  }
}
