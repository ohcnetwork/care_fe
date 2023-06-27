export class AssetFilters {
  filterAssets(
    facilityName: string,
    assetType: string,
    assetStatus: string,
    assetClass: string
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
    cy.contains("Apply").click();
  }
}
