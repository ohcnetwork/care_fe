export class AssetPagination {
  navigateToNextPage() {
    // only works for desktop mode
    cy.get("button#next-pages").click();
  }

  verifyNextUrl() {
    cy.url().should("include", "page=2");
  }

  navigateToPreviousPage() {
    // only works for desktop mode
    cy.get("button#prev-pages").click();
  }

  verifyPreviousUrl() {
    cy.url().should("include", "page=1");
  }
}
