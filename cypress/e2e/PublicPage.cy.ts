describe("Public Page Functionality", () => {
  before(() => {
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
  });

  it("Open the public page and filter the facility name ", () => {
    const district = "Ernakulam";
    const facilityName = "Care HQ";
    cy.visit("/");
    cy.typeAndSelectOption("#search-district", district);
    cy.verifyAndClickElement("#search-facility-btn", "Search Facilities");
    cy.get("#facility-search").type(facilityName);
    cy.verifyContentPresence("#facility-list", [facilityName]);
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
