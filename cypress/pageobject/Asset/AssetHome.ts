export class AssetHome {
  clickAssetByName(assetName: string) {
    cy.intercept("GET", "**/api/v1/asset/**").as("clearAssets");
    cy.get("[data-testid='created-asset-list']").contains(assetName).click();
    cy.wait("@clearAssets").its("response.statusCode").should("eq", 200);
  }

  typeAssetSearch(name: string) {
    cy.get("#asset-search").click().type(name);
  }

  verifyAssetIsPresent(assetName: string) {
    cy.get("[data-testid=created-asset-list]")
      .first()
      .should("contain", assetName);
  }

  clickAssetDetailsUpdateButton() {
    cy.verifyAndClickElement("[data-testid='asset-update-button']", "Update");
  }

  clearAndTypeQRCode(qrCode: string) {
    cy.get("#qr_code_id").clear();
    cy.get("#qr_code_id").click().type(qrCode);
  }

  clearAndTypeSerialNumber(serialNumber: string) {
    cy.get("#serial-number").clear();
    cy.get("#serial-number").click().type(serialNumber);
  }

  clickAssetSubmitButton() {
    cy.intercept("GET", "**/api/v1/asset/**").as("getAssets");
    cy.get("#submit").click();
    cy.wait("@getAssets").its("response.statusCode").should("eq", 200);
  }

  clickAssetUpdateSubmitButton() {
    cy.intercept("GET", "**/api/v1/asset/**").as("getAssets");
    cy.clickSubmitButton("Update");
    cy.wait("@getAssets").its("response.statusCode").should("eq", 200);
  }

  navigateToAssetsPage() {
    cy.visit("/assets");
  }

  verifyAssetListContains(dummyCameraText: string) {
    cy.get("[data-testid='created-asset-list']").should(
      "contain",
      dummyCameraText,
    );
  }

  scanAssetQR() {
    cy.contains("Scan Asset QR").click().wait(1000);
    cy.get("video").should("exist");
    cy.get("button").contains("Close Scanner").should("exist").click();
  }

  selectImportFacility(facilityName: string) {
    cy.get("input[name='facilities']")
      .type(facilityName)
      .then(() => {
        cy.get("[role='option']").contains(facilityName).click();
      });
  }

  selectAssetImportButton(action: "click" | "verifyNotExist"): void {
    const selector = "[data-testid=import-asset-button]";
    if (action === "click") {
      cy.get(selector).scrollIntoView().should("be.visible").click();
    } else if (action === "verifyNotExist") {
      cy.get(selector).should("not.exist");
    }
  }

  selectJsonExportButton() {
    cy.intercept("GET", "**/api/v1/asset/?**json=true**").as("getJsonexport");
    cy.get("#export-json-option").should("be.visible").click();
    cy.wait("@getJsonexport").its("response.statusCode").should("eq", 200);
  }

  selectCsvExportButton() {
    cy.intercept("GET", "**/api/v1/asset/?**csv=true**").as("getCsvexport");
    cy.get("#export-csv-option").should("be.visible").click();
    cy.wait("@getCsvexport").its("response.statusCode").should("eq", 200);
  }

  selectImportOption() {
    cy.get(".import-assets-button").click();
  }

  importAssetFile() {
    cy.get("[data-testid=import-file]")
      .selectFile("cypress/fixtures/sample-asset.xlsx", { force: true })
      .wait(100);
  }

  selectImportLocation(locationName: string) {
    cy.clickAndSelectOption(
      "[data-testid=select-import-location]",
      locationName,
    );
  }

  clickImportAsset() {
    cy.intercept("POST", "**/api/v1/asset/").as("importAsset");
    cy.clickSubmitButton("Import");
    cy.wait("@importAsset").its("response.statusCode").should("eq", 201);
  }
}
