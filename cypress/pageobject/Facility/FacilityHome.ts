// cypress/support/pageObjects/FacilityHome.ts

class FacilityHome {
  // Selectors
  exportButton = "#export-button";
  searchButton = "#search";
  menuItem = "[role='menuitem']";

  // Operations
  clickExportButton() {
    cy.get(this.exportButton).click();
  }

  clickSearchButton() {
    cy.get(this.searchButton).click();
  }

  clickMenuItem(itemName: string) {
    cy.get(this.menuItem).contains(itemName).click();
  }

  csvDownloadIntercept(alias: string, queryParam: string) {
    cy.intercept("GET", `**/api/v1/facility/?csv${queryParam}`).as(alias);
  }

  verifyDownload(alias: string) {
    cy.wait(`@${alias}`).its("response.statusCode").should("eq", 200);
  }

  getURL() {
    return cy.url();
  }

  verifyURLContains(searchText) {
    const encodedText = encodeURIComponent(searchText).replace(/%20/g, "+");
    this.getURL().should("include", `search=${encodedText}`);
  }
}

export default FacilityHome;
