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
    cy.get(this.usernameText).should("have.text", username);
  }

  checkUsernameBadgeVisibility(shouldBeVisible: boolean) {
    const assertion = shouldBeVisible ? "be.visible" : "not.be.visible";
    cy.get(this.usernameBadge).should(assertion);
  }

  clickRemoveIcon() {
    cy.get(this.removeIcon).click();
  }
}
