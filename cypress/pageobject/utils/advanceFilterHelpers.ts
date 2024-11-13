export const advanceFilters = {
  clickAdvancedFiltersButton() {
    cy.verifyAndClickElement("#advanced-filter", "Advanced Filters");
  },

  selectState(state: string) {
    cy.clickAndSelectOption("#state", state);
  },

  selectDistrict(district: string) {
    cy.clickAndSelectOption("#district", district);
  },

  selectLocalBody(localBody: string) {
    cy.clickAndSelectOption("#local_body", localBody);
  },

  applySelectedFilter() {
    cy.verifyAndClickElement("#apply-filter", "Apply");
  },

  selectFacilityType(facilityType: string) {
    cy.clickAndSelectOption("#facility_type", facilityType);
  },

  clickClearAdvanceFilters() {
    cy.verifyAndClickElement("#clear-filter", "Clear");
  },
};
