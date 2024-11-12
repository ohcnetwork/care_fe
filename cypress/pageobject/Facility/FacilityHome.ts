class FacilityHome {
  // Selectors
  exportButton = "#export-button";
  searchButton = "#search";
  menuItem = "[role='menuitem']";

  // Operations
  clickExportButton() {
    cy.get(this.exportButton).scrollIntoView();
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

  clickViewCnsButton() {
    cy.get("#view-cns-button").first().click();
  }

  verifyCnsUrl() {
    cy.url().should("include", "/cns");
  }

  verifyLiveMonitorUrl() {
    cy.url().should("include", "/live-monitoring?location=");
  }

  clickFacilityNotifyButton() {
    cy.get("#facility-notify", { timeout: 10000 }).should("be.visible");
    cy.get("#facility-notify").focus().click();
  }

  clickLiveMonitorButton() {
    cy.get("#live-monitoring-button").scrollIntoView();
    cy.get("#live-monitoring-button").click();
  }

  clickFacilityLiveMonitorButton() {
    cy.get("#facility-detailspage-livemonitoring").scrollIntoView();
    cy.get("#facility-detailspage-livemonitoring").click();
  }

  clickFacilityCnsButton() {
    cy.get("#facility-detailspage-cns").scrollIntoView();
    cy.get("#facility-detailspage-cns").click();
  }

  selectLocation(location: string) {
    cy.get("#location").click().type(location);
    cy.get("li[role=option]").contains(location).click();
  }

  verifyFacilityDetailsUrl() {
    cy.url().should("match", /\/facility\/[\w-]+/);
  }

  verifyPatientListVisibility() {
    cy.get("#patient-name-list").scrollIntoView();
    cy.get("#patient-name-list").should("be.visible");
  }

  verifyPatientListUrl() {
    cy.url().should("match", /\/patients\?facility=.+/);
  }

  verifyOccupancyBadgeVisibility() {
    cy.get('[data-test-id="occupancy-badge"]').should("be.visible");
  }

  verifyAndCloseNotifyModal() {
    cy.get("#cancel").should("be.visible");
    cy.get("#cancel").click();
  }

  navigateBack() {
    cy.go(-1);
  }

  clickViewFacilityDetails() {
    cy.get("#facility-details").should("be.visible");
    cy.get("#facility-details").first().click();
  }

  verifyDownload(alias: string) {
    cy.wait(`@${alias}`, { timeout: 60000 })
      .its("response.statusCode")
      .should("eq", 200);
  }

  getURL() {
    return cy.url();
  }

  verifyURLContains(searchText: string) {
    const encodedText = encodeURIComponent(searchText).replace(/%20/g, "+");
    this.getURL().should("include", `search=${encodedText}`);
  }
}

export default FacilityHome;
