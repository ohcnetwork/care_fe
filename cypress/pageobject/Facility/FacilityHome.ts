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

  pollForCsvDownload(queryParam: string, retries = 10, delay = 5000) {
    // Make a GET request to the API
    cy.request({
      method: "GET",
      url: `/api/v1/facility/?csv${queryParam}`,
      failOnStatusCode: false, // Allow Cypress to proceed even if the status is not 200
    }).then((response) => {
      if (response && response.status === 200) {
        // Success, CSV is ready
        cy.log("API returned 200! File is ready for download.");
      } else if (retries > 0) {
        cy.wait(delay); // Wait for a delay before retrying
        this.pollForCsvDownload(queryParam, retries - 1, delay); // Retry
      } else {
        throw new Error("API did not return 200 within the allowed retries");
      }
    });
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
    cy.get("#facility-notify").first().click();
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

  selectLocation(location) {
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
    cy.get("#occupany-badge").should("be.visible");
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

  verifyURLContains(searchText) {
    const encodedText = encodeURIComponent(searchText).replace(/%20/g, "+");
    this.getURL().should("include", `search=${encodedText}`);
  }
}

export default FacilityHome;
