export class AssetFilters {
  filterAssets(assetStatus: string, assetClass: string, assetLocation: string) {
    cy.clickAndSelectOption("#asset-status", assetStatus);
    cy.clickAndSelectOption("#asset-class", assetClass);
    cy.typeAndSelectOption("#Facilities-location", assetLocation);
  }
}
