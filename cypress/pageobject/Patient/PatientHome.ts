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
}
export default PatientHome;
