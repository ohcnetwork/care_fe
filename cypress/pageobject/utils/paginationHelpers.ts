export const pageNavigation = {
  navigateToNextPage() {
    cy.get("button#next-pages").click();
  },

  verifyCurrentPageNumber(pageNumber: number) {
    cy.url().should("include", `page=${pageNumber}`);
  },

  navigateToPreviousPage() {
    cy.get("button#prev-pages").click();
  },
};
