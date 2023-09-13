export class AssetFilters {
  filterAssets(
    facilityName: string,
    assetType: string,
    assetStatus: string,
    assetClass: string,
    assetLocation: string
  ) {
    cy.contains("Advanced Filters").click();
    cy.get("input[name='Facilities']")
      .click()
      .type(facilityName)
      .then(() => {
        cy.get("[role='option']").contains(facilityName).click();
      });
    cy.get("#asset-type")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(assetType).click();
      });
    cy.get("#asset-status")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(assetStatus).click();
      });
    cy.get("#asset-class")
      .click()
      .then(() => {
        cy.get("[role='option']").contains(assetClass).click();
      });
    cy.get("#Facilities-location")
      .click()
      .type(assetLocation)
      .then(() => {
        cy.get("[role='option']").contains(assetLocation).click();
      });
    cy.contains("Apply").click();
  }
  clearFilters() {
    cy.intercept("GET", "**/api/v1/asset/**").as("clearAssets");
    cy.get("#clear-filter").click();
    cy.wait("@clearAssets").its("response.statusCode").should("eq", 200);
    cy.url().should("match", /\/assets$/);
  }
  clickadvancefilter() {
    cy.intercept("GET", "**/api/v1/getallfacilities/**").as("advancefilter");
    cy.get("#advanced-filter").click();
    cy.wait("@advancefilter").its("response.statusCode").should("eq", 200);
  }
  clickslideoverbackbutton() {
    cy.get("#close-slide-over").click();
  }
  // Assertions
  assertFacilityText(text) {
    cy.get("[data-testid=Facility]").should("contain", text);
  }
  assertAssetTypeText(text) {
    cy.get("[data-testid='Asset Type']").should("contain", text);
  }
  assertAssetClassText(text) {
    cy.get("[data-testid='Asset Class']").should("contain", text);
  }
  assertStatusText(text) {
    cy.get("[data-testid=Status]").should("contain", text);
  }
  assertLocationText(text) {
    cy.get("[data-testid=Location]").should("contain", text);
  }
}
