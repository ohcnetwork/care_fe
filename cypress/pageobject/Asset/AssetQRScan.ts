export class AssetQRScanPage {
  scanAssetQR() {
    cy.contains("Scan Asset QR").click().wait(1000);
    cy.get("video").should("exist");
    cy.get("button").contains("Close Scanner").should("exist").click();
  }
}
