export const pageNavigation = {
  navigateToNextPage() {
    cy.get("button#next-pages").click();
    cy.intercept("GET", "**/v1/patient/?page=2").as("getPage2");
    cy.wait("@getPage2");
  },

  verifyCurrentPageNumber(pageNumber: number) {
    cy.url().should("include", `page=${pageNumber}`);
  },

  navigateToPreviousPage() {
    cy.get("button#prev-pages").click();
  },
};
