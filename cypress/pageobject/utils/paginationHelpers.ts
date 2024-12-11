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

  interceptPatientNavigation() {
    cy.intercept(
      "GET",
      "/api/v1/patient/?page=2&limit=12&is_active=True&offset=12",
    ).as("getPatientPage");
  },

  verifyPatientNavigation() {
    cy.wait("@getPatientPage").its("response.statusCode").should("eq", 200);
  },
};
