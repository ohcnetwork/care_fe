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
    cy.get(`${this.usernameText}-${username}`).should("contain.text", username);
  }

  checkUsernameTextDoesNotExist(username: string) {
    cy.get(`${this.usernameText}-${username}`).should("not.exist");
  }

  checkUsernameBadgeVisibility(shouldBeVisible: boolean) {
    const assertion = shouldBeVisible ? "be.visible" : "not.be.visible";
    cy.get(this.usernameBadge).should(assertion);
  }

  clickRemoveIcon() {
    cy.get(this.removeIcon).click();
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

  verifyMultipleBadgesWithSameId(alreadylinkedusersviews: string[]) {
    cy.wrap(alreadylinkedusersviews).each((username) => {
      cy.get(`#name-${username}`).scrollIntoView().should("be.visible");
    });
  }

  switchToListView() {
    cy.get("#user-list-view").click();
  }

  verifyListView() {
    cy.get("#user-list-view").should("have.class", "text-white");
  }
}
