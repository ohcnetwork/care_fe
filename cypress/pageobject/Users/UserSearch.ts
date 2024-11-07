// UserPage.ts
export class UserPage {
  // Element selectors
  searchByUsernameInput = "#search-by-username";
  usernameText = "#username";
  usernameBadge = "[data-testid='Username']";
  removeIcon = "#removeicon";

  checkSearchInputVisibility() {
    cy.get(this.searchByUsernameInput).should("be.visible");
  }

  typeInSearchInput(text: string) {
    cy.get(this.searchByUsernameInput).click().type(text);
  }

  clearSearchInput() {
    cy.get(this.searchByUsernameInput).click().clear();
  }

  checkUrlForUsername(username: string) {
    cy.url().should("include", `username=${username}`);
  }

  checkUsernameText(username: string) {
    cy.get(this.usernameText).should("contain.text", username);
  }

  checkUsernameBadgeVisibility(shouldBeVisible: boolean) {
    const assertion = shouldBeVisible ? "be.visible" : "not.be.visible";
    cy.get(this.usernameBadge).should(assertion);
  }

  clickRemoveIcon() {
    cy.get(this.removeIcon).click();
  }

  clickAdvancedFilters() {
    cy.get("#advanced-filter").contains("Advanced Filters").click();
  }

  typeInFirstName(firstName: string) {
    cy.get("#first_name").click().type(firstName);
  }

  typeInLastName(lastName: string) {
    cy.get("#last_name").click().type(lastName);
  }

  selectRole(role: string) {
    cy.get("#role button").click();
    cy.get("[role='option']").contains(role).click();
  }

  selectState(state: string) {
    cy.typeAndSelectOption("#state input", state);
  }

  selectDistrict(district: string) {
    cy.typeAndSelectOption("#district input", district);
  }

  typeInPhoneNumber(phone: string) {
    cy.get("#phone_number").click().type(phone);
  }

  typeInAltPhoneNumber(altPhone: string) {
    cy.get("#alt_phone_number").click().type(altPhone);
  }

  selectHomeFacility(facility: string) {
    cy.typeAndSelectOption("input[name='home_facility']", facility);
  }

  applyFilter() {
    cy.get("#apply-filter").click();
  }

  verifyDataTestIdText(testId: string, text: string) {
    cy.get(`[data-testid="${testId}"]`).contains(text).should("be.visible");
  }

  clearFilters() {
    this.clickAdvancedFilters();
    cy.get("#clear-filter").contains("Clear").click();
  }

  verifyDataTestIdNotVisible(testId: string) {
    cy.get(`[data-testid="${testId}"]`).should("not.be.visible");
  }

  navigateToNextPage() {
    cy.get("button#next-pages").click();
  }

  navigateToPreviousPage() {
    cy.get("button#prev-pages").click();
  }

  verifyCurrentPageNumber(pageNumber: number) {
    cy.url().should("include", `page=${pageNumber}`);
  }

  verifyMultipleBadgesWithSameId(alreadylinkedusersviews: string[]) {
    cy.get("#user-view-name").then(($elements) => {
      const userViews = $elements
        .map((_, el) => Cypress.$(el).text().trim())
        .get();
      let foundMatches = 0;

      alreadylinkedusersviews.forEach((expectedContent) => {
        const index = userViews.findIndex((actualContent) =>
          actualContent.includes(expectedContent),
        );
        if (index !== -1) {
          userViews.splice(index, 1); // Remove the matched element
          foundMatches++;
        }
        if (foundMatches === alreadylinkedusersviews.length) {
          return false; // Break the loop if all matches are found
        }
      });
    });
  }
}
