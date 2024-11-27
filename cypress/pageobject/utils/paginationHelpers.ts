export const pageNavigation = {
  navigateToNextPage() {
    cy.intercept("GET", "**/api/patient/?page=2").as("getPage2");
    cy.get("button#next-pages").click();
    cy.wait("@getPage2");
  },

  verifyCurrentPageNumber(pageNumber: number) {
    cy.url().should("include", `page=${pageNumber}`);
  },

  navigateToPreviousPage() {
    cy.get("button#prev-pages").click();
  },
};
