class FacilityHome {
  // Selectors
  exportButton = "#export-button";
  menuItem = "[role='menuitem']";

  // Operations
  clickExportButton() {
    cy.get(this.exportButton).scrollIntoView();
    cy.get(this.exportButton).click();
  }

  navigateToFacilityHomepage() {
    cy.visit("/facility");
  }

  assertFacilityInCard(facilityName: string) {
    cy.get("#facility-name-card").should("contain", facilityName);
  }

  interceptFacilitySearchReq() {
    cy.intercept("GET", "**/api/v1/facility/**").as("searchFacility");
  }

  verifyFacilitySearchReq() {
    cy.wait("@searchFacility").its("response.statusCode").should("eq", 200);
  }

  typeFacilitySearch(facilityName: string) {
    cy.get("#facility-search").click().clear().type(facilityName);
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
    cy.get("#facility-notify").as("facilityNotify");
    cy.get("@facilityNotify", { timeout: 10000 }).should("be.visible");
    cy.get("@facilityNotify").first().click();
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

  assertFacilityBadgeContent(occupied: string, total: string) {
    cy.get('[data-test-id="occupancy-badge-text"]').should(
      "contain.text",
      `Occupancy: ${occupied} / ${total}`,
    );
  }

  assertFacilityBadgeBackgroundColor(color: string) {
    cy.get('[data-test-id="occupancy-badge"]').should(
      "have.css",
      "background-color",
      color,
    );
  }
}

export default FacilityHome;
