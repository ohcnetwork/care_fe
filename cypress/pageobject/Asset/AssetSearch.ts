export class AssetSearchPage {
  typeSearchKeyword(keyword: string) {
    cy.get("#search").click().clear();
    cy.get("#search").click().type(keyword);
  }

  pressEnter() {
    cy.get("[name='search']").type("{enter}");
  }

  clickAssetByName(assetName: string) {
    cy.intercept("GET", "**/api/v1/asset/**").as("clearAssets");
    cy.get("[data-testid='created-asset-list']").contains(assetName).click();
    cy.wait("@clearAssets").its("response.statusCode").should("eq", 200);
  }

  verifyBadgeContent(expectedText: string) {
    cy.get("[data-testid='Name/Serial No./QR ID']").should(
      "contain",
      expectedText,
    );
  }

  verifyAssetIsPresent(assetName: string) {
    cy.get("[data-testid=created-asset-list]")
      .first()
      .should("contain", assetName);
  }

  clickUpdateButton() {
    cy.get("[data-testid='asset-update-button']").contains("Update").click();
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

  visitAssetsPage() {
    cy.visit("/assets");
  }

  verifyAssetListContains(dummyCameraText: string) {
    cy.get("[data-testid='created-asset-list']").should(
      "contain",
      dummyCameraText,
    );
  }
}
