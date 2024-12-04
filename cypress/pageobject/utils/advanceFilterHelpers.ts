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

  typeFacilityName(facilityName: string) {
    cy.typeAndSelectOption("input[name='Facilities']", facilityName);
  },

  clickslideoverbackbutton() {
    cy.get("#close-slide-over").click();
  },

  clickClearAdvanceFilters() {
    cy.intercept("GET", "**/api/v1/asset/**").as("clearAssets");
    cy.verifyAndClickElement("#clear-filter", "Clear");
    cy.wait("@clearAssets").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("match", /\/assets$/);
    cy.url().then((url) => {
      const queryParams = new URL(url).searchParams;
      let allEmpty = true;
      const blacklistedKeys = ["page", "limit", "offset"];

      queryParams.forEach((value, key) => {
        if (value !== "" && !blacklistedKeys.includes(key)) {
          allEmpty = false;
        }
      });

      expect(allEmpty).to.be.true;
    });
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
