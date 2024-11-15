export class AssetFilters {
  filterAssets(
    facilityName: string,
    assetStatus: string,
    assetClass: string,
    assetLocation: string,
  ) {
    cy.contains("Advanced Filters").click();
    cy.get("input[name='Facilities']")
      .click()
      .type(facilityName)
      .then(() => {
        cy.get("[role='option']").contains(facilityName).click();
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
  }
  clickslideoverbackbutton() {
    cy.get("#close-slide-over").click();
  }
  // Assertions
  assertFacilityText(text: string) {
    cy.get("[data-testid=Facility]").should("contain", text);
  }
  assertAssetClassText(text: string) {
    cy.get("[data-testid='Asset Class']").should("contain", text);
  }
  assertStatusText(text: string) {
    cy.get("[data-testid=Status]").should("contain", text);
  }
  assertLocationText(text: string) {
    cy.get("[data-testid=Location]").should("contain", text);
  }
}
