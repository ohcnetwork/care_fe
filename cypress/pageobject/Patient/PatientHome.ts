class PatientHome {
  clickNextPage() {
    cy.get("#next-pages").click();
  }

  verifySecondPageUrl() {
    cy.url().should("include", "/patients?page=2");
  }

  clickPreviousPage() {
    cy.get("#prev-pages").click();
  }

  clickPatientExport() {
    cy.get("#patient-export").click();
  }

  clickPatientFilterApply() {
    cy.get("#apply-filter").click();
  }

  interceptPatientExportRequest() {
    cy.intercept({
      method: "GET",
      url: "/api/v1/patient/*",
    }).as("getPatients");
  }

  verifyPatientExportRequest() {
    cy.wait("@getPatients").then((interception) => {
      expect(interception.request.url).to.include("/api/v1/patient/");
      expect(interception.request.url).to.include("&csv");
      expect(interception.response.statusCode).to.eq(200);
    });
  }

  typePatientModifiedBeforeDate(startDate: string) {
    cy.clickAndTypeDate("input[name='modified_date_start']", startDate);
  }

  typePatientModifiedAfterDate(endDate: string) {
    cy.clickAndTypeDate("input[name='modified_date_end']", endDate);
  }

  clickPatientAdvanceFilters() {
    cy.get("#advanced-filter").click();
  }
}
export default PatientHome;
