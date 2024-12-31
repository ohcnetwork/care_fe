export const advanceFilters = {
  clickAdvancedFiltersButton() {
    cy.verifyAndClickElement("#advanced-filter", "Advanced Filters");
  },

  selectState(state: string) {
    cy.wait(1000);
    cy.clickAndSelectOption("#state", state);
  },

  selectDistrict(district: string) {
    cy.wait(1000);
    cy.clickAndSelectOption("#district", district);
  },

  selectLocalBody(localBody: string) {
    cy.wait(1000);
    cy.clickAndSelectOption("#local_body", localBody);
  },

  selectWard(ward: string) {
    cy.wait(1000);
    cy.clickAndSelectOption("#ward", ward);
  },

  applySelectedFilter() {
    cy.verifyAndClickElement("#apply-filter", "Apply");
  },

  selectFacilityType(facilityType: string) {
    cy.clickAndSelectOption("#facility_type", facilityType);
  },

  typeFacilityName(facilityName: string) {
    cy.typeAndSelectOption("input[name='Facilities']", facilityName);
  },

  clickslideoverbackbutton() {
    cy.get("#close-slide-over").click();
  },

  clickClearAdvanceFilters() {
    cy.verifyAndClickElement("#clear-filter", "Clear");
  },

  verifyFilterBadgePresence(
    badgeTestId: string,
    text: string,
    visible: boolean = true,
  ) {
    const badgeElement = cy.get(`[data-testid="${badgeTestId}"]`);
    if (visible) {
      badgeElement.contains(text).should("be.visible");
    } else {
      badgeElement.should("not.be.visible");
    }
  },
};
