import ShiftingPage from "../../pageobject/Shift/ShiftFilters";

describe("Shifting section filter", () => {
  const shiftingPage = new ShiftingPage();

  before(() => {
    cy.loginByApi("devdistrictadmin", "Coronasafe@123");
    cy.saveLocalStorage();
  });

  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.clearLocalStorage(/filters--.+/);
    cy.awaitUrl("/shifting");
    shiftingPage.advancedFilterButton().click();
  });

  it("filter by facility", () => {
    shiftingPage.filterByFacility(
      "Dummy Shifting",
      "Dummy Shifting",
      "District",
    );

    shiftingPage.facilityAssignedBadge().should("exist");
    shiftingPage.currentFacilityBadge().should("exist");
  });

  it("filter by other category", () => {
    shiftingPage.filterByOtherCategory(
      "ASC Created Date",
      "yes",
      "yes",
      "no",
      "MODERATE",
      "9999999999",
    );
    shiftingPage.orderingBadge().should("exist");
    shiftingPage.breathlessnessLevelBadge().should("exist");
    shiftingPage.phoneNumberBadge().should("exist");
  });

  it("filter by date", () => {
    shiftingPage.filterByDate("#date-1", "#date-8", "#date-1", "#date-8");

    shiftingPage.createdAfterBadge().should("exist");
    shiftingPage.createdBeforeBadge().should("exist");
    shiftingPage.modifiedAfterBadge().should("exist");
    shiftingPage.modifiedBeforeBadge().should("exist");
  });

  afterEach(() => {
    cy.saveLocalStorage();
  });
});
